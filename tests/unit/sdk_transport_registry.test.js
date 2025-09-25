import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { resetStreamableTransportCache } from '../../src/server/loadStreamableTransport.js'

function createResponseRecorder() {
  return {
    status: null,
    headers: null,
    payload: null,
    statusCode: undefined,
    writeHead(code, headers) {
      this.status = code
      this.headers = headers
      this.statusCode = code
    },
    end(body) {
      this.payload = typeof body === 'string' ? (() => {
        try {
          return JSON.parse(body)
        } catch (err) {
          return body
        }
      })() : body
    }
  }
}

describe('Transport Registry Unit Tests', () => {
  let registry

  it('should create transport registry', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)

    assert(registry, 'Registry should be created')
  })

  it('should validate endpoint detection', () => {
    assert.equal(registry.isMcpEndpoint('/mcp'), true, 'Should detect /mcp')
    assert.equal(registry.isLegacySseEndpoint('/mcp/events'), true, 'Should detect legacy SSE')
    assert.equal(registry.isLegacyMessageEndpoint('/mcp/messages'), true, 'Should detect legacy message')
    assert.equal(registry.isMcpEndpoint('/invalid'), false, 'Should not detect invalid')
  })

  it('should handle session ID extraction', () => {
    const req1 = { headers: { 'x-session-id': 'header-id' }, url: '/mcp' }
    const req2 = { headers: {}, url: '/mcp?sessionId=query-id' }
    const req3 = { headers: {}, url: '/mcp' }

    assert.equal(registry.extractSessionId(req1), 'header-id', 'Should extract from header')
    assert.equal(registry.extractSessionId(req2), 'query-id', 'Should extract from query')
    assert.equal(registry.extractSessionId(req3), undefined, 'Should return undefined')
  })

  it('should parse JSON bodies and report parsing errors', async () => {
    const config = createSdkServerConfig({ port: 4444 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)

    const parsed = await localRegistry.readJsonBody(Readable.from(['{"value":1}']))
    assert.deepEqual(parsed, { value: 1 })

    const empty = await localRegistry.readJsonBody(Readable.from([]))
    assert.equal(empty, undefined)

    const whitespace = await localRegistry.readJsonBody(Readable.from(['   ']))
    assert.equal(whitespace, undefined)

    const invalid = await localRegistry.readJsonBody(Readable.from(['{invalid}']))
    assert.equal(invalid, undefined)
  })

  it('should reject unsupported protocol versions', () => {
    const config = createSdkServerConfig({ port: 4747 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const response = {
      status: null,
      headers: null,
      payload: null,
      writeHead(code, headers) {
        this.status = code
        this.headers = headers
      },
      end(body) {
        this.payload = JSON.parse(body)
      }
    }

    const allowed = localRegistry.validateProtocolVersion({ headers: { 'mcp-protocol-version': '2024-01-01' } }, response)

    assert.equal(allowed, false)
    assert.equal(response.status, 400)
    assert.equal(response.payload.error.code, 'invalid_protocol_version')
  })

  it('should return structured response for deprecated endpoints', () => {
    const config = createSdkServerConfig({ port: 5555 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const response = {
      status: null,
      headers: null,
      payload: null,
      writeHead(code, headers) {
        this.status = code
        this.headers = headers
      },
      end(body) {
        this.payload = JSON.parse(body)
      }
    }

    localRegistry.sendLegacyEndpointDeprecated(response, '/mcp/events', 'GET')

    assert.equal(response.status, 404)
    assert.equal(response.headers['Content-Type'], 'application/json')
    assert.equal(response.payload.error.code, 'endpoint_deprecated')
    assert.equal(response.payload.error.migration.oldEndpoint, '/mcp/events')
    assert.equal(response.payload.error.migration.method, 'GET')
  })

  it('should send error payload with provided status code', () => {
    const config = createSdkServerConfig({ port: 5656 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const response = {
      status: null,
      headers: null,
      body: null,
      writeHead(code, headers) {
        this.status = code
        this.headers = headers
      },
      end(body) {
        this.body = body
      }
    }

    localRegistry.sendError(response, 418, 'teapot')

    assert.equal(response.status, 418)
    assert.equal(response.headers['Content-Type'], 'application/json')
    assert.equal(response.body, JSON.stringify({ code: 418, message: 'teapot' }))
  })

  it('should emit heartbeat events and timeout inactive sessions', async () => {
    const config = createSdkServerConfig({
      port: 6666,
      heartbeatIntervalMs: 5,
      requestTimeoutMs: 10
    })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const writes = []
    const transport = { close: async () => {} }
    const response = {
      writableEnded: false,
      write(chunk) {
        writes.push(chunk)
      },
      end() {
        this.writableEnded = true
      }
    }
    const tracked = {
      sessionId: 'session-1',
      response,
      transport,
      lastActivity: Date.now() - 20
    }
    localRegistry.activeTransports.set('session-1', tracked)

    localRegistry.startHeartbeat(tracked)
    await new Promise((resolve) => {
      setTimeout(resolve, 25)
    })
    localRegistry.stopHeartbeat('session-1')

    assert.equal(localRegistry.activeTransports.has('session-1'), false)
    assert(writes.some((chunk) => String(chunk).includes('event: heartbeat')))
    assert(writes.some((chunk) => String(chunk).includes('event: error')))
  })

  it('should cleanup expired sessions and close transports', async () => {
    const config = createSdkServerConfig({ port: 7777 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const timer = setInterval(() => {}, 1000)
    let closed = false
    localRegistry.heartbeatTimers.set('session-2', timer)
    localRegistry.activeTransports.set('session-2', {
      sessionId: 'session-2',
      transport: {
        async close() {
          closed = true
        }
      },
      createdAt: Date.now() - 1000
    })

    const expired = localRegistry.cleanupExpiredSessions(500)

    assert.deepEqual(expired, ['session-2'])
    assert.equal(localRegistry.activeTransports.has('session-2'), false)
    assert.equal(localRegistry.heartbeatTimers.has('session-2'), false)
    assert.equal(closed, true)
  })

  it('should handle stopHeartbeat when response already ended', async () => {
    const config = createSdkServerConfig({
      port: 7878,
      heartbeatIntervalMs: 1,
      requestTimeoutMs: 100
    })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const tracked = {
      sessionId: 'session-ended',
      response: { writableEnded: true },
      transport: { close: async () => {} },
      lastActivity: Date.now()
    }
    localRegistry.activeTransports.set('session-ended', tracked)

    localRegistry.startHeartbeat(tracked)
    await new Promise((resolve) => {
      setTimeout(resolve, 5)
    })

    assert.equal(localRegistry.activeTransports.has('session-ended'), false)
    assert.equal(localRegistry.heartbeatTimers.has('session-ended'), false)
  })

  it('should log errors when closing transports fails', async () => {
    const config = createSdkServerConfig({ port: 7979 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const originalError = console.error
    const logs = []
    console.error = (...args) => logs.push(args.join(' '))

    localRegistry.activeTransports.set('session-err', {
      sessionId: 'session-err',
      transport: {
        async close() {
          throw new Error('close failed')
        }
      },
      createdAt: Date.now()
    })

    try {
      await localRegistry.close()
      assert.equal(localRegistry.activeTransports.size, 0)
      assert(logs.some((line) => line.includes('Error closing transport')))
    } finally {
      console.error = originalError
    }
  })

  it('should report missing streamable sessions', () => {
    const config = createSdkServerConfig({ port: 8081 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const response = createResponseRecorder()

    const tracked = localRegistry.getStreamableSession('missing', response)

    assert.equal(tracked, null)
    assert.equal(response.status, 404)
    assert.equal(response.payload.message, 'Session not found')
  })

  it('should execute streamable delete handler and refresh activity timestamp', async () => {
    const config = createSdkServerConfig({ port: 8181 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    let handlerCalls = 0
    const tracked = {
      sessionId: 'streamable-session',
      type: 'streamable',
      transport: {
        async handleRequest(_req, _res) {
          handlerCalls += 1
        }
      },
      lastActivity: 0
    }
    localRegistry.activeTransports.set('streamable-session', tracked)

    const request = {
      headers: { 'mcp-session-id': 'streamable-session' },
      url: '/mcp?sessionId=streamable-session'
    }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableDelete(request, response)

    assert.equal(handlerCalls, 1)
    assert.ok(tracked.lastActivity > 0)
    assert.equal(response.status, null)
    assert.equal(response.payload, null)
  })

  it('handleMcpPost returns 404 when session missing', async () => {
    const config = createSdkServerConfig({ port: 8282 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = Readable.from(['{"jsonrpc":"2.0"}'])
    request.headers = { 'mcp-session-id': 'unknown' }
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(response.status, 404)
    assert.equal(response.payload.error, 'Session not found')
  })

  it('handleMcpPost rejects streamable requests with invalid JSON body', async () => {
    const config = createSdkServerConfig({ port: 8383 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const tracked = {
      type: 'streamable',
      transport: {
        async handleRequest() {
          throw new Error('should not run')
        }
      },
      lastActivity: 0
    }
    localRegistry.activeTransports.set('streamable', tracked)

    const request = Readable.from(['   '])
    request.headers = { 'mcp-session-id': 'streamable' }
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(response.status, 400)
    assert.equal(response.payload.message, 'Invalid JSON body')
    assert.equal(tracked.lastActivity, 0)
  })

  it('handleMcpPost processes streamable session requests and updates activity', async () => {
    const config = createSdkServerConfig({ port: 8484 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    let handled = 0
    const tracked = {
      type: 'streamable',
      transport: {
        async handleRequest(_req, response, body) {
          handled += 1
          response.writeHead?.(200, { 'Content-Type': 'application/json' })
          response.end?.(JSON.stringify(body))
        }
      },
      lastActivity: 0
    }
    localRegistry.activeTransports.set('streamable', tracked)

    const request = Readable.from(['{"foo":"bar"}'])
    request.headers = { 'mcp-session-id': 'streamable' }
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(handled, 1)
    assert.ok(tracked.lastActivity > 0)
    assert.equal(response.status, 200)
    assert.deepEqual(response.payload, { foo: 'bar' })
  })

  it('handleMcpPost updates activity for SSE post messages', async () => {
    const config = createSdkServerConfig({ port: 8585 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const tracked = {
      type: 'sse',
      transport: {
        async handlePostMessage(req, res) {
          res.statusCode = 202
        }
      },
      lastActivity: null
    }
    localRegistry.activeTransports.set('sse-session', tracked)

    const request = Readable.from(['ignored'])
    request.headers = { 'mcp-session-id': 'sse-session' }
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.ok(typeof tracked.lastActivity === 'number')
  })

  it('handleMcpPost clears activity when SSE post not accepted', async () => {
    const config = createSdkServerConfig({ port: 8686 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const tracked = {
      type: 'sse',
      transport: {
        async handlePostMessage(req, res) {
          res.statusCode = 200
        }
      },
      lastActivity: 123
    }
    localRegistry.activeTransports.set('sse-session-2', tracked)

    const request = Readable.from(['ignored'])
    request.headers = { 'mcp-session-id': 'sse-session-2' }
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(tracked.lastActivity, null)
  })

  it('handleMcpPost rejects non-initialize payload without session', async () => {
    const config = createSdkServerConfig({ port: 8787 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = Readable.from(['{"jsonrpc":"2.0"}'])
    request.headers = {}
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(response.status, 400)
    assert.equal(response.payload.error, 'Missing session ID')
  })

  it('handleMcpPost enforces capacity limits when creating sessions', async () => {
    const config = createSdkServerConfig({ port: 8888 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    for (let i = 0; i < config.maxClients; i += 1) {
      localRegistry.activeTransports.set('client-' + i, { type: 'sse' })
    }

    const request = Readable.from(['{"method":"initialize"}'])
    request.headers = {}
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(response.status, 429)
    assert.equal(response.payload.error.code, 'too_many_clients')
  })

  it('handleMcpPost returns 501 when streamable transport unavailable', async () => {
    await resetStreamableTransportCache()
    const config = createSdkServerConfig({ port: 8989 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)

    const request = Readable.from(['{"method":"initialize"}'])
    request.headers = {}
    request.url = '/mcp'
    const response = createResponseRecorder()

    await localRegistry.handleMcpPost(request, response)

    assert.equal(response.status, 501)
    assert.equal(response.payload.error.code, 'streamable_unavailable')
  })

  it('handleMcpPost creates streamable session when transport available', async () => {
    await resetStreamableTransportCache()
    const baseDir = path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'server')
    await fs.mkdir(baseDir, { recursive: true })
    const stubPath = path.join(baseDir, 'streamableHttp.js')
    const stubContent = `export class StreamableHTTPServerTransport {
  constructor(options) {
    this.options = options;
    this.sessionId = 'stub-session';
    this.onclose = null;
  }
  async handleRequest(req, res, body) {
    res.writeHead?.(200, { "Content-Type": "application/json" });
    res.end?.(JSON.stringify(body));
  }
  async close() {}
}
`
    await fs.writeFile(stubPath, stubContent)

    const config = createSdkServerConfig({ port: 9090 })
    const serverStub = {
      async connect() {
        return null
      }
    }
    const localRegistry = new SdkTransportRegistry(config, serverStub)

    const request = Readable.from(['{"method":"initialize"}'])
    request.headers = {}
    request.url = '/mcp'
    const response = createResponseRecorder()

    try {
      await localRegistry.handleMcpPost(request, response)
      assert.equal(response.status, 200)
      assert.ok(localRegistry.activeTransports.has('stub-session'))
    } finally {
      await resetStreamableTransportCache()
      await fs.rm(stubPath, { force: true })
      localRegistry.activeTransports.clear()
    }
  })

  it('handleStreamableGet uses tracked transport handler', async () => {
    const config = createSdkServerConfig({ port: 9191 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    let handled = 0
    const tracked = {
      type: 'streamable',
      transport: {
        async handleRequest(req, res) {
          handled += 1
          res.end?.('ok')
        }
      },
      lastActivity: 0
    }
    localRegistry.activeTransports.set('session-get', tracked)

    const request = { headers: {}, url: '/mcp' }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableGet('session-get', request, response)

    assert.equal(handled, 1)
    assert.ok(tracked.lastActivity > 0)
  })

  it('handleStreamableGet validates protocol version before proceeding', async () => {
    const config = createSdkServerConfig({ port: 9595 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = { headers: { 'mcp-protocol-version': '2024-01-01' }, url: '/mcp' }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableGet('any', request, response)

    assert.equal(response.status, 400)
    assert.equal(response.payload.error.code, 'invalid_protocol_version')
  })

  it('handleStreamableGet returns when session not found', async () => {
    const config = createSdkServerConfig({ port: 9696 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = { headers: {}, url: '/mcp' }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableGet('missing', request, response)

    assert.equal(response.status, 404)
    assert.equal(response.payload.message, 'Session not found')
  })

  it('start routes incoming requests based on method and path', async () => {
    const config = createSdkServerConfig({ port: 9797 })
    const serverStub = {
      async connect() {
        return null
      }
    }
    const localRegistry = new SdkTransportRegistry(config, serverStub)
    let capturedHandler
    const createServerStub = mock.method(http, 'createServer', (fn) => {
      capturedHandler = fn
      return {
        keepAliveTimeout: 0,
        headersTimeout: 0,
        listening: true,
        listen: () => {},
        address: () => ({ port: config.port })
      }
    })

    try {
      const info = await localRegistry.start()
      assert.equal(info.baseUrl, 'http://127.0.0.1:' + config.port)
      assert.equal(info.port, config.port)

      const optionsRes = createResponseRecorder()
      await capturedHandler({ method: 'OPTIONS' }, optionsRes)
      assert.equal(optionsRes.status, 204)

      let getHits = 0
      localRegistry.handleStreamableGet = async () => { getHits += 1 }
      await capturedHandler({ method: 'GET', url: '/mcp', headers: { 'mcp-session-id': 'abc' } }, createResponseRecorder())
      assert.equal(getHits, 1)

      let sseHits = 0
      localRegistry.handleSseConnection = async () => { sseHits += 1 }
      await capturedHandler({ method: 'GET', url: '/mcp', headers: {}, on: () => {} }, createResponseRecorder())
      assert.equal(sseHits, 1)

      let postHits = 0
      localRegistry.handleMcpPost = async () => { postHits += 1 }
      const postReq = Readable.from(['{}'])
      postReq.method = 'POST'
      postReq.url = '/mcp'
      postReq.headers = {}
      await capturedHandler(postReq, createResponseRecorder())
      assert.equal(postHits, 1)

      let deleteHits = 0
      localRegistry.handleStreamableDelete = async () => { deleteHits += 1 }
      await capturedHandler({ method: 'DELETE', url: '/mcp', headers: { 'mcp-session-id': 'abc' } }, createResponseRecorder())
      assert.equal(deleteHits, 1)

      const unsupportedRes = createResponseRecorder()
      await capturedHandler({ method: 'PATCH', url: '/mcp' }, unsupportedRes)
      assert.equal(unsupportedRes.status, 405)

      const legacyGetRes = createResponseRecorder()
      await capturedHandler({ method: 'GET', url: '/mcp/events' }, legacyGetRes)
      assert.equal(legacyGetRes.status, 404)
      assert.equal(legacyGetRes.payload.error.code, 'endpoint_deprecated')

      const legacyPostRes = createResponseRecorder()
      await capturedHandler({ method: 'POST', url: '/mcp/messages' }, legacyPostRes)
      assert.equal(legacyPostRes.status, 404)

      const notFoundRes = createResponseRecorder()
      await capturedHandler({ method: 'GET', url: '/unknown' }, notFoundRes)
      assert.equal(notFoundRes.status, 404)
    } finally {
      createServerStub.mock.restore()
    }
  })

  it('handleStreamableDelete validates protocol version', async () => {
    const config = createSdkServerConfig({ port: 9292 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = { headers: { 'mcp-protocol-version': '2024-01-01' }, url: '/mcp' }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableDelete(request, response)

    assert.equal(response.status, 400)
    assert.equal(response.payload.error.code, 'invalid_protocol_version')
  })

  it('handleStreamableDelete requires session id', async () => {
    const config = createSdkServerConfig({ port: 9393 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = { headers: {}, url: '/mcp' }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableDelete(request, response)

    assert.equal(response.status, 400)
    assert.equal(response.payload.message, 'Missing session ID')
  })

  it('handleStreamableDelete returns not found when session missing', async () => {
    const config = createSdkServerConfig({ port: 9494 })
    const server = createSdkServer(config)
    const localRegistry = new SdkTransportRegistry(config, server)
    const request = { headers: { 'mcp-session-id': 'absent' }, url: '/mcp' }
    const response = createResponseRecorder()

    await localRegistry.handleStreamableDelete(request, response)

    assert.equal(response.status, 404)
    assert.equal(response.payload.message, 'Session not found')
  })
})
