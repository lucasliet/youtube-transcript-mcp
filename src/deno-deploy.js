import { McpServer } from './server/mcp-server.js'
import { registerTranscriptTool } from './server/register-transcript-tool.js'

const SERVER_NAME = 'youtube-transcript-mcp'
const SERVER_VERSION = '2.0.3'
const HEARTBEAT_INTERVAL_MS = 25_000
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id'
}

const server = new McpServer(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
)
registerTranscriptTool(server)

/** @type {Map<string, { controller: ReadableStreamDefaultController, heartbeatTimer: ReturnType<typeof setInterval> }>} */
const sessions = new Map()

/**
 * Encodes an SSE event into the wire format.
 * @param {string} event Event name.
 * @param {unknown} data Data to serialize as JSON.
 * @returns {Uint8Array} Encoded bytes.
 */
function encodeEvent(event, data) {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

/**
 * Sends an SSE event to a session's stream controller.
 * @param {string} sessionId Target session identifier.
 * @param {string} event Event name.
 * @param {unknown} data Event payload.
 */
function sendEvent(sessionId, event, data) {
  const session = sessions.get(sessionId)
  if (!session) return
  try {
    session.controller.enqueue(encodeEvent(event, data))
  } catch {
    cleanupSession(sessionId)
  }
}

/**
 * Clears heartbeat timer and removes the session from the registry.
 * @param {string} sessionId Session to remove.
 */
function cleanupSession(sessionId) {
  const session = sessions.get(sessionId)
  if (!session) return
  clearInterval(session.heartbeatTimer)
  sessions.delete(sessionId)
}

/**
 * Dispatches a JSON-RPC message to the MCP server and sends the response via SSE.
 * @param {string} sessionId Session receiving the response.
 * @param {object} body Parsed JSON-RPC request body.
 */
async function dispatchJsonRpc(sessionId, body) {
  const { id, method, params } = body

  try {
    if (method === 'notifications/initialized' || method?.startsWith('notifications/')) {
      return
    }

    let result

    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
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
      sendEvent(sessionId, 'message', {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: 'Method not found' }
      })
      return
    }

    sendEvent(sessionId, 'message', { jsonrpc: '2.0', id, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendEvent(sessionId, 'message', {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message }
    })
  }
}

/**
 * Handles GET /mcp — opens an SSE session stream.
 * @returns {Response} SSE streaming response.
 */
function handleSseConnect() {
  const sessionId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encodeEvent('heartbeat', { sessionId, timestamp: Date.now() }))
        } catch {
          cleanupSession(sessionId)
        }
      }, HEARTBEAT_INTERVAL_MS)

      sessions.set(sessionId, { controller, heartbeatTimer })
      controller.enqueue(encodeEvent('endpoint', `/mcp?sessionId=${sessionId}`))
    },
    cancel() {
      cleanupSession(sessionId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Mcp-Session-Id': sessionId,
      ...CORS_HEADERS
    }
  })
}

/**
 * Handles POST /mcp — receives a JSON-RPC message for an existing SSE session.
 * @param {Request} req Incoming request.
 * @param {URL} url Parsed request URL.
 * @returns {Promise<Response>} 202 on success, 400/404 on error.
 */
async function handleMcpPost(req, url) {
  const sessionId = url.searchParams.get('sessionId') ?? req.headers.get('mcp-session-id') ?? ''

  if (!sessions.has(sessionId)) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    })
  }

  dispatchJsonRpc(sessionId, body).catch(() => {})

  return new Response(null, { status: 202, headers: CORS_HEADERS })
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

  if (url.pathname === '/mcp') {
    if (req.method === 'GET') return handleSseConnect()
    if (req.method === 'POST') return handleMcpPost(req, url)
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
