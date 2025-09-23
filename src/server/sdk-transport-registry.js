import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import http from 'node:http'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { logSdkError, logSdkTransport, SDK_ERROR_CATEGORIES } from '../lib/log.js'


async function loadStreamableHTTPServerTransport() {
  if (streamableTransportPromise === undefined) {
    streamableTransportPromise = await safeImportStreamableTransport()
  }
  return streamableTransportPromise
}


export class SdkTransportRegistry {
  constructor(config, server) {
    this.config = config
    this.server = server
    this.activeTransports = new Map()
    this.httpServer = null
    this.heartbeatTimers = new Map()
  }

  async start() {
    this.httpServer = http.createServer(async (req, res) => {
      try {
        this.setupCorsHeaders(res)

        if (req.method === 'OPTIONS') {
          res.writeHead(204)
          res.end()
          return
        }

        if (this.isMcpEndpoint(req.url)) {
          if (req.method === 'GET') {
            const sessionId = this.extractSessionId(req)
            if (sessionId) {
              await this.handleStreamableGet(sessionId, req, res)
              return
            }
            await this.handleSseConnection(req, res)
            return
          }

          if (req.method === 'POST') {
            await this.handleMcpPost(req, res)
            return
          }

          if (req.method === 'DELETE') {
            await this.handleStreamableDelete(req, res)
            return
          }

          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 'method_not_allowed', message: 'Method Not Allowed' }))
          return
        }

        if (req.method === 'GET' && this.isLegacySseEndpoint(req.url)) {
          this.sendLegacyEndpointDeprecated(res, '/mcp/events', 'GET')
          return
        }

        if (req.method === 'POST' && this.isLegacyMessageEndpoint(req.url)) {
          this.sendLegacyEndpointDeprecated(res, '/mcp/messages', 'POST')
          return
        }

        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ code: 'not_found', message: 'Not Found' }))
      } catch (err) {
        console.error('Transport registry error:', err)
        this.sendError(res, 500, 'Internal Server Error')
      }
    })

    this.httpServer.keepAliveTimeout = this.config.requestTimeoutMs * 2
    this.httpServer.headersTimeout = this.config.requestTimeoutMs * 2
    this.httpServer.listen({ port: this.config.port, host: this.config.host })

    if (this.httpServer.listening === false) {
      await once(this.httpServer, 'listening')
    }

    const address = this.httpServer.address()
    const actualPort = typeof address === 'object' && address ? address.port : this.config.port
    const baseUrl = 'http://' + (this.config.host === '0.0.0.0' ? '127.0.0.1' : this.config.host) + ':' + actualPort

    return { baseUrl, port: actualPort }
  }

  setupCorsHeaders(res) {
    if (this.config.cors) {
      const origin = this.config.cors === true ? '*' : this.config.cors
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Mcp-Session-Id, X-Session-Id, MCP-Protocol-Version')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')
      
      if (origin !== '*' && !this.isAllowedOrigin(origin)) {
        console.warn('CORS: Origin ' + origin + ' not in allowed list')
      }
    }
  }

  isAllowedOrigin(origin) {
    if (!origin) return false
    // Allow localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true
    }
    if (typeof this.config.cors === 'string' && this.config.cors !== '*') {
      return origin === this.config.cors
    }
    if (Array.isArray(this.config.allowedOrigins) && this.config.allowedOrigins.length > 0) {
      return this.config.allowedOrigins.includes(origin)
    }
    return process.env.NODE_ENV === 'development'
  }

  isMcpEndpoint(url) {
    if (!url) return false
    const [pathname] = url.split('?')
    return pathname === '/mcp'
  }

  isLegacySseEndpoint(url) {
    if (!url) return false
    const [pathname] = url.split('?')
    return pathname === '/mcp/events'
  }

  isLegacyMessageEndpoint(url) {
    if (!url) return false
    const [pathname] = url.split('?')
    return pathname === '/mcp/messages'
  }

  /**
   * Extracts the MCP protocol version header from the incoming request.
   * @param req Incoming HTTP request instance.
   * @returns Normalized protocol version string or undefined when missing.
   */
  getProtocolVersionHeader(req) {
    const raw = req?.headers?.['mcp-protocol-version']
    if (raw === undefined || raw === null) {
      return undefined
    }
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value === undefined || value === null) {
      return undefined
    }
    const normalized = String(value).trim()
    return normalized.length > 0 ? normalized : undefined
  }

  /**
   * Validates whether the MCP protocol version header matches the supported version.
   * @param req Incoming HTTP request instance.
   * @param res Outgoing HTTP response used to report validation failures.
   * @returns True when the request may proceed, false when the response was sent.
   */
  validateProtocolVersion(req, res) {
    const version = this.getProtocolVersionHeader(req)
    if (!version || version === SUPPORTED_PROTOCOL_VERSION) {
      return true
    }

    logSdkError(
      SDK_ERROR_CATEGORIES.MCP_PROTOCOL,
      'Unsupported MCP protocol version: ' + version,
      undefined,
      { version, supported: SUPPORTED_PROTOCOL_VERSION }
    )

    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: {
        code: 'invalid_protocol_version',
        message: 'Unsupported MCP protocol version',
        supported: SUPPORTED_PROTOCOL_VERSION
      }
    }))
    return false
  }

  async handleSseConnection(req, res) {
    try {
      if (!this.validateProtocolVersion(req, res)) {
        return
      }

      if (this.isAtCapacity()) {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: {
            code: 'too_many_clients',
            message: 'Maximum number of clients reached'
          }
        }))
        return
      }

      logSdkTransport('sse_connection_start', { endpoint: '/mcp', userAgent: req.headers['user-agent'] })

      const transport = new SSEServerTransport('/mcp', res)
      res.setHeader('Mcp-Session-Id', transport.sessionId)
      await this.server.connect(transport)

      const sessionId = transport.sessionId
      const tracked = {
        type: 'sse',
        sessionId,
        transport,
        response: res,
        createdAt: Date.now(),
        lastActivity: null
      }

      const originalSend = transport.send.bind(transport)
      transport.send = async (message) => {
        try {
          return await originalSend(message)
        } finally {
          tracked.lastActivity = null
        }
      }

      this.activeTransports.set(sessionId, tracked)
      this.startHeartbeat(tracked)

      logSdkTransport('sse_connection_established', { sessionId, type: 'sse' })

      req.on('close', () => {
        logSdkTransport('sse_connection_closed', { sessionId, type: 'sse' })
        this.stopHeartbeat(sessionId)
        this.activeTransports.delete(sessionId)
      })
    } catch (err) {
      logSdkError(SDK_ERROR_CATEGORIES.SSE_CONNECTION, "SSE connection failed: " + err.message, undefined, {
        endpoint: '/mcp',
        error: err.message
      })
      // Don't try to send error response here - transport may have already started
      throw err
    }
  }

  async handleMcpPost(req, res) {
    if (!this.validateProtocolVersion(req, res)) {
      return
    }
    const sessionId = this.extractSessionId(req)

    if (sessionId) {
      const tracked = this.activeTransports.get(sessionId)
      if (!tracked) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Session not found' }))
        return
      }

      if (tracked.type === 'streamable') {
        const body = await this.readJsonBody(req)
        if (body === undefined) {
          this.sendError(res, 400, 'Invalid JSON body')
          return
        }

        try {
          await tracked.transport.handleRequest(req, res, body)
        } finally {
          tracked.lastActivity = Date.now()
        }
        return
      }

      const activityTimestamp = Date.now()
      try {
        await tracked.transport.handlePostMessage(req, res)
      } finally {
        if (res.statusCode === 202) {
          tracked.lastActivity = activityTimestamp
        } else {
          tracked.lastActivity = null
        }
      }
      return
    }

    const body = await this.readJsonBody(req)
    if (body === undefined) {
      this.sendError(res, 400, 'Invalid JSON body')
      return
    }

    if (!isInitializeRequestBody(body)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing session ID' }))
      return
    }

    if (this.isAtCapacity()) {
      res.writeHead(429, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        error: {
          code: 'too_many_clients',
          message: 'Maximum number of clients reached'
        }
      }))
      return
    }

    await this.createStreamableSession(req, res, body)
  }

  async createStreamableSession(req, res, body) {
    const StreamableHTTPServerTransport = await loadStreamableHTTPServerTransport()
    if (!StreamableHTTPServerTransport) {
      res.writeHead(501, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        error: {
          code: 'streamable_unavailable',
          message: 'Streamable HTTP transport is not available. Establish an SSE session with GET /mcp instead.'
        }
      }))
      return
    }

    const tracked = {
      type: 'streamable',
      sessionId: undefined,
      transport: undefined,
      createdAt: Date.now(),
      lastActivity: Date.now()
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        tracked.sessionId = id
        this.activeTransports.set(id, tracked)
        logSdkTransport('streamable_connection_established', { sessionId: id, type: 'streamable' })
      },
      enableDnsRebindingProtection: this.config.enableDnsRebindingProtection === true,
      allowedHosts: this.config.allowedHosts,
      allowedOrigins: this.config.allowedOrigins
    })

    tracked.transport = transport

    transport.onclose = () => {
      if (tracked.sessionId) {
        this.activeTransports.delete(tracked.sessionId)
      }
    }

    await this.server.connect(transport)

    try {
      await transport.handleRequest(req, res, body)
      tracked.lastActivity = Date.now()
    } catch (err) {
      if (tracked.sessionId) {
        this.activeTransports.delete(tracked.sessionId)
      }
      transport.close?.().catch(() => {})
      throw err
    }

    if (!tracked.sessionId && transport.sessionId) {
      tracked.sessionId = transport.sessionId
      this.activeTransports.set(transport.sessionId, tracked)
      logSdkTransport('streamable_connection_established', { sessionId: transport.sessionId, type: 'streamable' })
    }
  }

  async handleStreamableGet(sessionId, req, res) {
    if (!this.validateProtocolVersion(req, res)) {
      return
    }
    const tracked = this.activeTransports.get(sessionId)
    if (!tracked || tracked.type !== 'streamable') {
      this.sendError(res, 404, 'Session not found')
      return
    }

    await this.#handleRequestWithActivityUpdate(tracked, req, res)
  }

  async handleStreamableDelete(req, res) {
    if (!this.validateProtocolVersion(req, res)) {
      return
    }
    const sessionId = this.extractSessionId(req)
    if (!sessionId) {
      this.sendError(res, 400, 'Missing session ID')
      return
    }

    const tracked = this.activeTransports.get(sessionId)
    if (!tracked || tracked.type !== 'streamable') {
      this.sendError(res, 404, 'Session not found')
      return
    }

    await this.#handleRequestWithActivityUpdate(tracked, req, res)
  }

  async #handleRequestWithActivityUpdate(tracked, req, res) {
    await this.#handleRequestWithActivityUpdate(tracked, req, res)
  }

  isAtCapacity() {
    return this.activeTransports.size >= this.config.maxClients
  }

  async readJsonBody(req) {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }

    if (chunks.length === 0) {
      return undefined
    }

    const raw = Buffer.concat(chunks).toString('utf8').trim()
    if (!raw) {
      return undefined
    }

    try {
      return JSON.parse(raw)
    } catch (err) {
      logSdkError(SDK_ERROR_CATEGORIES.MCP_PROTOCOL, 'Failed to parse JSON body', undefined, { error: err?.message })
      return undefined
    }
  }

  extractSessionId(req) {
    if (!req) return undefined
    const headerId = req.headers?.['mcp-session-id'] || req.headers?.['x-session-id'] || req.headers?.['X-Session-Id']
    if (headerId) return headerId
    if (!req.url) return undefined
    const queryIndex = req.url.indexOf('?')
    if (queryIndex === -1) return undefined
    const searchParams = new URLSearchParams(req.url.slice(queryIndex + 1))
    return searchParams.get('sessionId') || undefined
  }

  sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: statusCode, message }))
  }

  /**
   * Sends a migration guidance response for deprecated legacy endpoints.
   * @param res Outgoing HTTP response instance.
   * @param oldEndpoint Deprecated endpoint path accessed by the client.
   * @param method HTTP method used by the client request.
   * @returns Void.
   */
  sendLegacyEndpointDeprecated(res, oldEndpoint, method) {
    const message = 'Use ' + method + ' /mcp instead'
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: {
        code: 'endpoint_deprecated',
        message,
        migration: {
          oldEndpoint,
          newEndpoint: '/mcp',
          method
        }
      }
    }))
  }

  async close() {
    for (const sessionId of this.activeTransports.keys()) {
      this.stopHeartbeat(sessionId)
    }
    // Close all active transports
    for (const tracked of this.activeTransports.values()) {
      try {
        await tracked.transport.close?.()
      } catch (err) {
        console.error('Error closing transport:', err)
      }
    }
    this.activeTransports.clear()

    // Close HTTP server
    if (this.httpServer) {
      await new Promise((resolve, reject) => {
        this.httpServer.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }

  startHeartbeat(tracked) {
    const interval = this.config.heartbeatIntervalMs
    const timeout = this.config.requestTimeoutMs
    const sessionId = tracked.sessionId

    const timer = setInterval(() => {
      const res = tracked.response
      if (!res || res.writableEnded) {
        this.stopHeartbeat(sessionId)
        this.activeTransports.delete(sessionId)
        return
      }

      const payload = { sessionId, timestamp: Date.now() }
      res.write('event: heartbeat\n')
      res.write('data: ' + JSON.stringify(payload) + '\n\n')

      if (typeof tracked.lastActivity === 'number' && Date.now() - tracked.lastActivity > timeout) {
        logSdkError(SDK_ERROR_CATEGORIES.SDK_TIMEOUT, 'Session timed out', undefined, { sessionId })
        const errorPayload = {
          code: 'timeout',
          message: 'Request timed out',
          sessionId
        }
        res.write('event: error\n')
        res.write('data: ' + JSON.stringify(errorPayload) + '\n\n')
        this.stopHeartbeat(sessionId)
        this.activeTransports.delete(sessionId)
        tracked.transport.close?.().catch(() => {})
      }
    }, interval)

    this.heartbeatTimers.set(sessionId, timer)
  }

  stopHeartbeat(sessionId) {
    const timer = this.heartbeatTimers.get(sessionId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(sessionId)
    }
  }

  cleanupExpiredSessions(timeoutMs = this.config.requestTimeoutMs) {
    const expired = []
    const now = Date.now()
    for (const [sessionId, tracked] of this.activeTransports.entries()) {
      if (now - tracked.createdAt > timeoutMs) {
        expired.push(sessionId)
        this.stopHeartbeat(sessionId)
        this.activeTransports.delete(sessionId)
        tracked.transport.close?.().catch(() => {})
      }
    }
    return expired
  }
}
import { safeImportStreamableTransport } from '../lib/safeImport.js'
