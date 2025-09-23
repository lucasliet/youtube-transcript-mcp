import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import http from 'node:http'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { logSdkError, logSdkTransport, SDK_ERROR_CATEGORIES } from '../lib/log.js'

import { loadStreamableTransport } from './sdk-config.js'

/**
 * Checks if the request body is an initialize request.
 * @param {object} body The request body.
 * @returns {boolean} True if it's an initialize request, false otherwise.
 */
function isInitializeRequestBody(body) {
  if (!body || typeof body !== 'object') return false
  if (body.method !== 'initialize') return false
  return true
}

const SUPPORTED_PROTOCOL_VERSION = '2025-06-18'

/**
 * Manages SDK transports (SSE and Streamable HTTP) for the remote server.
 */
export class SdkTransportRegistry {
  /**
   * @param {object} config The server configuration.
   * @param {import('@modelcontextprotocol/sdk').Server} server The MCP server instance.
   */
  constructor(config, server) {
    this.config = config
    this.server = server
    this.activeTransports = new Map()
    this.httpServer = null
    this.heartbeatTimers = new Map()
  }

  /**
   * Starts the HTTP server and listens for incoming connections.
   * @returns {Promise<{baseUrl: string, port: number}>} The base URL and port of the server.
   */
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

  /**
   * Sets up CORS headers for the response.
   * @param {import('http').ServerResponse} res The HTTP response object.
   */
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

  /**
   * Checks if the given origin is allowed by the CORS configuration.
   * @param {string} origin The origin to check.
   * @returns {boolean} True if the origin is allowed, false otherwise.
   */
  isAllowedOrigin(origin) {
    if (!origin) return false
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

  /**
   * Checks if the URL is an MCP endpoint.
   * @param {string} url The URL to check.
   * @returns {boolean} True if it's an MCP endpoint, false otherwise.
   */
  isMcpEndpoint(url) {
    if (!url) return false
    const [pathname] = url.split('?')
    return pathname === '/mcp'
  }

  /**
   * Checks if the URL is a legacy SSE endpoint.
   * @param {string} url The URL to check.
   * @returns {boolean} True if it's a legacy SSE endpoint, false otherwise.
   */
  isLegacySseEndpoint(url) {
    if (!url) return false
    const [pathname] = url.split('?')
    return pathname === '/mcp/events'
  }

  /**
   * Checks if the URL is a legacy message endpoint.
   * @param {string} url The URL to check.
   * @returns {boolean} True if it's a legacy message endpoint, false otherwise.
   */
  isLegacyMessageEndpoint(url) {
    if (!url) return false
    const [pathname] = url.split('?')
    return pathname === '/mcp/messages'
  }

  /**
   * Extracts the MCP protocol version header from the incoming request.
   * @param {import('http').IncomingMessage} req Incoming HTTP request instance.
   * @returns {string|undefined} Normalized protocol version string or undefined when missing.
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
   * @param {import('http').IncomingMessage} req Incoming HTTP request instance.
   * @param {import('http').ServerResponse} res Outgoing HTTP response used to report validation failures.
   * @returns {boolean} True when the request may proceed, false when the response was sent.
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

  /**
   * Handles an SSE connection request.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @param {import('http').ServerResponse} res The HTTP response object.
   */
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
      logSdkError(SDK_ERROR_CATEGORIES.SSE_CONNECTION, 'SSE connection failed: ' + err.message, undefined, {
        endpoint: '/mcp',
        error: err.message
      })
      throw err
    }
  }

  /**
   * Handles an MCP POST request.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @param {import('http').ServerResponse} res The HTTP response object.
   */
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

  /**
   * Creates a streamable session.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @param {import('http').ServerResponse} res The HTTP response object.
   * @param {object} body The request body.
   */
  async createStreamableSession(req, res, body) {
    const StreamableHTTPServerTransport = await loadStreamableTransport()
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

  /**
   * Handles a streamable GET request.
   * @param {string} sessionId The session ID.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @param {import('http').ServerResponse} res The HTTP response object.
   */
  async handleStreamableGet(sessionId, req, res) {
    if (!this.validateProtocolVersion(req, res)) {
      return
    }
    const tracked = this.activeTransports.get(sessionId)
    if (!tracked || tracked.type !== 'streamable') {
      this.sendError(res, 404, 'Session not found')
      return
    }

    try {
      await tracked.transport.handleRequest(req, res)
    } finally {
      tracked.lastActivity = Date.now()
    }
  }

  /**
   * Handles a streamable DELETE request.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @param {import('http').ServerResponse} res The HTTP response object.
   */
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

    try {
      await tracked.transport.handleRequest(req, res)
    } finally {
      tracked.lastActivity = Date.now()
    }
  }

  /**
   * Checks if the server is at maximum client capacity.
   * @returns {boolean} True if at capacity, false otherwise.
   */
  isAtCapacity() {
    return this.activeTransports.size >= this.config.maxClients
  }

  /**
   * Reads and parses a JSON body from the request.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @returns {Promise<object|undefined>} The parsed JSON body or undefined.
   */
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

  /**
   * Extracts the session ID from the request headers or URL.
   * @param {import('http').IncomingMessage} req The HTTP request object.
   * @returns {string|undefined} The session ID or undefined.
   */
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

  /**
   * Sends an error response.
   * @param {import('http').ServerResponse} res The HTTP response object.
   * @param {number} statusCode The HTTP status code.
   * @param {string} message The error message.
   */
  sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: statusCode, message }))
  }

  /**
   * Sends a migration guidance response for deprecated legacy endpoints.
   * @param {import('http').ServerResponse} res Outgoing HTTP response instance.
   * @param {string} oldEndpoint Deprecated endpoint path accessed by the client.
   * @param {string} method HTTP method used by the client request.
   * @returns {void}.
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

  /**
   * Closes all active transports and the HTTP server.
   */
  async close() {
    for (const sessionId of this.activeTransports.keys()) {
      this.stopHeartbeat(sessionId)
    }
    for (const tracked of this.activeTransports.values()) {
      try {
        await tracked.transport.close?.()
      } catch (err) {
        console.error('Error closing transport:', err)
      }
    }
    this.activeTransports.clear()

    if (this.httpServer) {
      await new Promise((resolve, reject) => {
        this.httpServer.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }

  /**
   * Starts the heartbeat for a tracked session.
   * @param {object} tracked The tracked session object.
   */
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

  /**
   * Stops the heartbeat for a given session ID.
   * @param {string} sessionId The session ID.
   */
  stopHeartbeat(sessionId) {
    const timer = this.heartbeatTimers.get(sessionId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(sessionId)
    }
  }

  /**
   * Cleans up expired sessions.
   * @param {number} [timeoutMs] The timeout in milliseconds for expired sessions.
   * @returns {string[]} An array of session IDs that were cleaned up.
   */
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