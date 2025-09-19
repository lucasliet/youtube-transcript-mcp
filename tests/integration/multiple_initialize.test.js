import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { startRemoteServer } from '../helpers/remoteFixtures.js'
import { skipIfCannotBindLoopback } from '../helpers/env.js'

const PROTOCOL_VERSION = '2025-06-18'

describe('Multiple Initialize Attempts Test', () => {
  let server
  let supportsStreamable

  before(async (t) => {
    if (!await skipIfCannotBindLoopback(t)) return
    server = await startRemoteServer({ port: 0 })
    supportsStreamable = Boolean(server?.config?.transports?.streamable)
  })

  after(async () => {
    await server?.close?.()
  })

  it('should create distinct sessions for sequential initialize requests', async (t) => {
    if (!supportsStreamable) {
      t.skip('Streamable HTTP transport not available in current SDK version')
      return
    }

    const buildRequest = (id, name) => ({
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        clientInfo: { name, version: '1.0.0' }
      }
    })

    const firstResponse = await globalThis.fetch(`${server.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': PROTOCOL_VERSION
      },
      body: JSON.stringify(buildRequest('init-1', 'client-1'))
    })

    assert.equal(firstResponse.status, 200, 'First initialize should succeed')
    const firstPayload = await firstResponse.json()
    const sessionIdA = firstResponse.headers.get('mcp-session-id')
    assert.equal(firstPayload.result.protocolVersion, PROTOCOL_VERSION, 'First response should echo protocol version')
    assert.equal(firstPayload.result.serverInfo.name, 'youtube-transcript-mcp', 'Server name should be included')
    assert(sessionIdA, 'First initialize should return session id')

    const secondResponse = await globalThis.fetch(`${server.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': PROTOCOL_VERSION
      },
      body: JSON.stringify(buildRequest('init-2', 'client-2'))
    })

    assert.equal(secondResponse.status, 200, 'Second initialize should succeed')
    const secondPayload = await secondResponse.json()
    const sessionIdB = secondResponse.headers.get('mcp-session-id')
    assert.equal(secondPayload.result.protocolVersion, PROTOCOL_VERSION, 'Second response should echo protocol version')
    assert(sessionIdB, 'Second initialize should return session id')
    assert.notEqual(sessionIdA, sessionIdB, 'Sessions should be distinct')
  })

  it('should allow subscribing to notifications using returned session id', async (t) => {
    if (!supportsStreamable) {
      t.skip('Streamable HTTP transport not available in current SDK version')
      return
    }

    const response = await globalThis.fetch(`${server.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': PROTOCOL_VERSION
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'init-subscribe',
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          clientInfo: { name: 'subscriber', version: '1.0.0' }
        }
      })
    })

    assert.equal(response.status, 200, 'Initialize should succeed before subscribing')
    const sessionId = response.headers.get('mcp-session-id')
    assert(sessionId, 'Subscription initialize should return session id')

    const controller = new AbortController()
    const streamResponse = await globalThis.fetch(`${server.baseUrl}/mcp`, {
      headers: {
        Accept: 'text/event-stream',
        'Mcp-Session-Id': sessionId,
        'MCP-Protocol-Version': PROTOCOL_VERSION
      },
      signal: controller.signal
    })

    assert.equal(streamResponse.status, 200, 'Event stream should open for existing session')
    controller.abort()
    await streamResponse.body?.cancel?.()
  })
})
