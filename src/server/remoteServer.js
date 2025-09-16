import http from 'node:http'
import { once } from 'node:events'
import { createServerConfig } from './config.js'
import { SessionRegistry } from './sessionRegistry.js'
import { handleEventStream } from './eventStreamHandler.js'
import { handleMessage } from './messageRouter.js'
import { logRemote } from './logging.js'

export async function startRemoteServer(overrides = {}) {
  const config = createServerConfig({ ...overrides, mode: 'remote' })
  const registry = new SessionRegistry(config, logRemote)
  const server = http.createServer(async (req, res) => {
    try {
      if (config.cors) {
        res.setHeader('Access-Control-Allow-Origin', config.cors === true ? '*' : config.cors)
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }
      if (req.method === 'GET' && matchPath(req.url, '/mcp/events')) {
        handleEventStream(req, res, registry)
        return
      }
      if (req.method === 'POST' && matchPath(req.url, '/mcp/messages')) {
        await handleMessage(req, res, registry)
        return
      }
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ code: 'not_found', message: 'Not Found' }))
    } catch (err) {
      logRemote('other_error', err?.message || 'server_error')
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
      }
      res.end(JSON.stringify({ code: 'server_error', message: 'Internal server error' }))
    }
  })
  server.keepAliveTimeout = config.requestTimeoutMs * 2
  server.headersTimeout = config.requestTimeoutMs * 2
  server.listen({ port: config.port, host: config.host })
  if (server.listening === false) {
    await once(server, 'listening')
  }
  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : config.port
  const baseUrl = `http://${config.host === '0.0.0.0' ? '127.0.0.1' : config.host}:${actualPort}`

  async function close() {
    registry.closeAll()
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  return { config, baseUrl, close }
}

function matchPath(url, path) {
  if (!url) return false
  const [pathname] = url.split('?')
  return pathname === path
}
