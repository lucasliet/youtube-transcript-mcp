import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { startRemoteServer } from '../helpers/remoteFixtures.js'

const noop = async () => {}

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

const PROTOCOL_VERSION = '2025-06-18'

test('integration: heartbeat emits and timeouts trigger error', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 200))
      return mkResponse(200, JSON.stringify({
        playabilityStatus: { status: 'OK' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              { baseUrl: 'https://example/slow', languageCode: 'en', kind: 'standard' }
            ],
            audioTracks: [ { defaultCaptionTrackIndex: 0 } ]
          }
        }
      }), 'application/json')
    }
    if (url === 'https://example/slow') {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 200))
      return mkResponse(200, '<transcript><text start="0.0" dur="0.5">Slow</text></transcript>')
    }
    if (typeof originalFetch === 'function') {
      return originalFetch(input, init)
    }
    throw new Error(`unexpected fetch ${url}`)
  }

  const server = await startRemoteServer({ port: 0, heartbeatIntervalMs: 20, requestTimeoutMs: 50 })
  t.after(async () => {
    globalThis.fetch = originalFetch
    await server.close().catch(noop)
  })

  const controller = new AbortController()
  const response = await globalThis.fetch(`${server.baseUrl}/mcp`, {
    headers: {
      Accept: 'text/event-stream',
      'MCP-Protocol-Version': PROTOCOL_VERSION
    },
    signal: controller.signal
  })
  t.after(() => controller.abort())
  assert.equal(response.status, 200, 'SSE connection should return 200')

  const sessionId = response.headers.get('mcp-session-id')
  assert.equal(typeof sessionId, 'string', 'Response headers should include session identifier')

  const stream = Readable.fromWeb(response.body)
  const decoder = new TextDecoder()
  let buffer = ''
  const iterator = stream[Symbol.asyncIterator]()

  async function nextEvent(timeoutMs = 1000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const boundary = buffer.indexOf('\n\n')
      if (boundary !== -1) {
        const raw = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        if (raw.trim().length === 0) continue
        return parseEvent(raw)
      }
      const { value, done } = await iterator.next()
      if (done) throw new Error('stream ended unexpectedly')
      buffer += decoder.decode(value, { stream: true })
    }
    throw new Error('event timeout')
  }

  // Discard endpoint event
  await nextEvent()

  let heartbeat
  const heartbeatDeadline = Date.now() + 2000
  while (Date.now() < heartbeatDeadline) {
    const evt = await nextEvent(2000)
    if (evt.event === 'heartbeat') {
      heartbeat = evt
      break
    }
  }
  assert.ok(heartbeat, 'Should emit heartbeat events')

  const timeoutResponse = await globalThis.fetch(`${server.baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': sessionId,
      'MCP-Protocol-Version': PROTOCOL_VERSION
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'req-timeout',
      method: 'tools/call',
      params: {
        name: 'transcript_yt',
        arguments: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
      }
    })
  })
  assert.equal(timeoutResponse.status, 202, 'Tool request should be accepted for processing')

  let timeoutEvent
  const timeoutDeadline = Date.now() + 4000
  while (Date.now() < timeoutDeadline) {
    const evt = await nextEvent(2000)
    if (evt.event === 'error') {
      timeoutEvent = JSON.parse(evt.data)
      break
    }
  }

  assert.ok(timeoutEvent, 'Should receive timeout error event')
  assert.equal(timeoutEvent.code, 'timeout', 'Error code should be timeout')
  assert.equal(timeoutEvent.sessionId, sessionId, 'Timeout event should reference session id')
})

function parseEvent(raw) {
  const lines = raw.split(/\r?\n/)
  const event = { event: 'message', data: '', id: undefined }
  const dataLines = []
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event.event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    } else if (line.startsWith('id:')) {
      event.id = line.slice(3).trim()
    }
  }
  event.data = dataLines.join('\n')
  return event
}
