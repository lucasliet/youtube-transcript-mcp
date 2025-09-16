import { transcriptYt } from '../tool/transcriptYt.js'
import { logRemote } from './logging.js'

export async function handleMessage(req, res, registry) {
  try {
    const body = await readBody(req)
    const validation = validateEnvelope(body)
    if (!validation.ok) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ code: 'invalid_request', message: validation.message }))
      return
    }
    const { connectionId, message } = validation
    const session = registry.get(connectionId)
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ code: 'not_found', message: 'connection not found' }))
      return
    }
    const state = session.registerRequest(message.id ?? null, message.method)
    if (!state) {
      res.writeHead(409, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ code: 'invalid_request', message: 'request already in progress' }))
      return
    }
    res.writeHead(202, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ accepted: true }))
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      session.sendError('timeout', 'request timed out', null, message.id ?? null)
      session.completeRequest()
    }, session.config.requestTimeoutMs)
    if (typeof timeout.unref === 'function') timeout.unref()
    const startedAt = Date.now()
    try {
      if (message.method === 'tools/list') {
        const response = buildListToolsResponse(message.id)
        if (!timedOut) {
          session.send('message', { response }, message.id ?? null)
          session.completeRequest()
        }
      } else if (message.method === 'tools/call') {
        const response = await handleToolCall(message.params, message.id)
        if (timedOut) {
          return
        }
        if (response) {
          session.send('message', { response }, message.id ?? null)
        } else {
          const elapsed = Date.now() - startedAt
          const code = elapsed >= session.config.requestTimeoutMs ? 'timeout' : 'tool_error'
          session.sendError(code, 'tool did not return a result', null, message.id ?? null)
        }
        session.completeRequest()
      } else {
        if (!timedOut) {
          session.sendError('invalid_request', 'unsupported method', null, message.id ?? null)
          session.completeRequest()
        }
      }
    } catch (err) {
      if (!timedOut) {
        const msg = err?.message || 'tool failure'
        logRemote('other_error', msg)
        session.sendError('tool_error', msg, null, message.id ?? null)
        session.completeRequest()
      }
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: 'invalid_request', message: err?.message || 'invalid payload' }))
  }
}

async function readBody(req) {
  let data = ''
  for await (const chunk of req) {
    data += chunk
  }
  if (!data) {
    throw new Error('empty body')
  }
  return JSON.parse(data)
}

function validateEnvelope(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'body must be object' }
  }
  const { connectionId, message } = body
  if (!connectionId || typeof connectionId !== 'string') {
    return { ok: false, message: 'connectionId required' }
  }
  if (!message || typeof message !== 'object') {
    return { ok: false, message: 'message required' }
  }
  if (message.jsonrpc !== '2.0') {
    return { ok: false, message: 'jsonrpc must be 2.0' }
  }
  if (!message.method || typeof message.method !== 'string') {
    return { ok: false, message: 'method required' }
  }
  return { ok: true, connectionId, message }
}

function buildListToolsResponse(id) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result: {
      tools: [
        {
          name: 'transcript_yt',
          description: 'Fetches YouTube transcript segments from a video URL for LLM consumption.',
          inputSchema: {
            type: 'object',
            properties: {
              videoUrl: { type: 'string', description: 'Full YouTube video URL.' },
              preferredLanguages: {
                type: 'array',
                items: { type: 'string' },
                description: "Optional ordered language codes preference, e.g., ['pt-BR','en']."
              }
            },
            required: ['videoUrl'],
            additionalProperties: false
          }
        }
      ]
    }
  }
}

async function handleToolCall(params, id) {
  const name = params?.name
  if (name !== 'transcript_yt') {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code: -32601,
        message: 'Tool not found'
      }
    }
  }
  const args = params?.arguments || {}
  const result = await transcriptYt({
    videoUrl: String(args.videoUrl || ''),
    preferredLanguages: Array.isArray(args.preferredLanguages) ? args.preferredLanguages : undefined
  })
  if (result === null) {
    return null
  }
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result: {
      content: [
        { type: 'text', text: JSON.stringify(result) }
      ]
    }
  }
}
