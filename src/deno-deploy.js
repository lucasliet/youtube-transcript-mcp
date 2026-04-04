import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { McpServer } from './server/mcp-server.js'
import { registerTranscriptTool } from './server/register-transcript-tool.js'

const SERVER_NAME = 'youtube-transcript-mcp'
const SERVER_VERSION = '2.0.3'
const PROTOCOL_VERSION = '2025-03-26'

const FAVICON_DATA = await Deno.readFile(new URL('../static/favicon.ico', import.meta.url))
const ROBOTS_DATA = await Deno.readTextFile(new URL('../static/robots.txt', import.meta.url))

const server = new McpServer(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
)
registerTranscriptTool(server)

/**
 * Dispatches a single JSON-RPC message and returns the response object.
 * Returns null for notifications (no response required).
 * @param {object} body Parsed JSON-RPC request.
 * @returns {Promise<object|null>} JSON-RPC response or null.
 */
async function dispatchJsonRpc(body) {
  const { id, method, params } = body

  if (method?.startsWith('notifications/') || id === undefined) {
    return null
  }

  try {
    let result

    if (method === 'initialize') {
      result = {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      }
    } else if (method === 'ping') {
      result = {}
    } else if (method === 'tools/list') {
      result = server.listTools()
    } else if (method === 'tools/call') {
      result = await server.callTool({ params })
    } else {
      return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } }
    }

    return { jsonrpc: '2.0', id, result }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { jsonrpc: '2.0', id, error: { code: -32000, message } }
  }
}

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Accept', 'Mcp-Session-Id', 'mcp-protocol-version'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  exposeHeaders: ['Mcp-Session-Id']
}))

app.get('/favicon.ico', (c) => {
  return c.body(FAVICON_DATA, 200, {
    'Content-Type': 'image/x-icon',
    'Cache-Control': 'public, max-age=86400'
  })
})

app.get('/robots.txt', (c) => {
  return c.text(ROBOTS_DATA, 200, {
    'Cache-Control': 'public, max-age=3600'
  })
})

app.post('/mcp', async (c) => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const sessionId = c.req.header('mcp-session-id') ?? crypto.randomUUID()
  const sessionHeaders = { 'Mcp-Session-Id': sessionId }

  if (Array.isArray(body)) {
    const results = await Promise.all(body.map(dispatchJsonRpc))
    const responses = results.filter((r) => r !== null)
    if (responses.length === 0) {
      return c.body(null, 202, sessionHeaders)
    }
    return c.json(responses, 200, sessionHeaders)
  }

  const result = await dispatchJsonRpc(body)
  if (result === null) {
    return c.body(null, 202, sessionHeaders)
  }

  return c.json(result, 200, sessionHeaders)
})

app.get('/mcp', (c) => {
  return c.json({ error: 'Method Not Allowed' }, 405)
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

Deno.serve(app.fetch)
