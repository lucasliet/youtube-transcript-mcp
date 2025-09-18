import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import http from 'node:http'
import { once } from 'node:events'
import { logSdkError, logSdkTransport, SDK_ERROR_CATEGORIES } from '../lib/log.js'

export class SdkTransportRegistry {
  constructor(config, server) {
    this.config = config
    this.server = server
    this.activeTransports = new Map()
    this.httpServer = null
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

        // Consolidated /mcp endpoint supporting SSE transport
        if (req.method === 'GET' && this.isMcpEndpoint(req.url)) {
          try {
            await this.handleSseConnection(req, res)
            return
          } catch (err) {
            console.error('SSE connection failed:', err.message)
            // Don't send error response - transport may have started
            return
          }
        }

        // Handle POST messages for SSE transport
        if (req.method === 'POST' && this.isMcpEndpoint(req.url)) {
          await this.handleSsePostMessage(req, res)
          return
        }

        // Handle legacy endpoints for backwards compatibility
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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Session-Id')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')
      
      // Validate allowed origins for security
      if (origin !== '*' && !this.isAllowedOrigin(origin)) {
        console.warn('CORS: Origin ' + origin + ' not in allowed list')
      }
    }
  }

  isAllowedOrigin(origin) {
    // Allow localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true
    }
    // Add more origin validation logic as needed
    return true // For now, allow all non-wildcard origins
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

  async handleSseConnection(req, res) {
    try {
      logSdkTransport('sse_connection_start', { endpoint: '/mcp', userAgent: req.headers['user-agent'] })
      
      const transport = new SSEServerTransport('/mcp', res)
      await this.server.connect(transport)
      
      // Track active transport for cleanup
      const transportId = transport.sessionId
      this.activeTransports.set(transportId, transport)
      
      logSdkTransport('sse_connection_established', { sessionId: transportId, type: 'sse' })
      
      // Clean up on connection close
      req.on('close', () => {
        logSdkTransport('sse_connection_closed', { sessionId: transportId, type: 'sse' })
        this.activeTransports.delete(transportId)
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

  async handleSsePostMessage(req, res) {
    // Find the transport by session ID from the request
    const sessionId = this.extractSessionId(req)
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing session ID' }))
      return
    }
    
    const transport = this.activeTransports.get(sessionId)
    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Session not found' }))
      return
    }
    
    await transport.handlePostMessage(req, res)
  }

  extractSessionId(req) {
    if (!req) return undefined
    const headerId = req.headers?.['x-session-id'] || req.headers?.['X-Session-Id']
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
    // Close all active transports
    for (const transport of this.activeTransports.values()) {
      try {
        await transport.close?.()
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
}
