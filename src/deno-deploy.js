import { McpServer } from './server/mcp-server.js'
import { registerTranscriptTool } from './server/register-transcript-tool.js'

const SERVER_NAME = 'youtube-transcript-mcp'
const SERVER_VERSION = '2.0.3'
const PROTOCOL_VERSION = '2025-03-26'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id'
}

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

/**
 * Handles POST /mcp — Streamable HTTP transport (MCP spec 2025-03-26).
 * Accepts JSON-RPC requests and returns inline JSON responses.
 * @param {Request} req Incoming request.
 * @returns {Promise<Response>} JSON response with MCP result.
 */
async function handleMcpPost(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  const sessionId = req.headers.get('mcp-session-id') ?? crypto.randomUUID()
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Mcp-Session-Id': sessionId,
    ...CORS_HEADERS
  }

  if (Array.isArray(body)) {
    const results = await Promise.all(body.map(dispatchJsonRpc))
    const responses = results.filter((r) => r !== null)
    if (responses.length === 0) {
      return new Response(null, { status: 202, headers: { 'Mcp-Session-Id': sessionId, ...CORS_HEADERS } })
    }
    return new Response(JSON.stringify(responses), { headers: responseHeaders })
  }

  const result = await dispatchJsonRpc(body)
  if (result === null) {
    return new Response(null, { status: 202, headers: { 'Mcp-Session-Id': sessionId, ...CORS_HEADERS } })
  }

  return new Response(JSON.stringify(result), { headers: responseHeaders })
}

/**
 * Main request handler for Deno.serve.
 * @param {Request} req Incoming HTTP request.
 * @returns {Promise<Response>} HTTP response.
 */
async function handler(req) {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (url.pathname === '/favicon.ico') {
    return new Response(FAVICON_DATA, {
      headers: { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' }
    })
  }

  if (url.pathname === '/robots.txt') {
    return new Response(ROBOTS_DATA, {
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' }
    })
  }

  if (url.pathname === '/mcp') {
    if (req.method === 'POST') return handleMcpPost(req)
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  })
}

Deno.serve(handler)
