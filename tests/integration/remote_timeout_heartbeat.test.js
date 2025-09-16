import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage } from '../helpers/remoteFixtures.js'

const noop = async () => {}

function mkResponse(status, body, contentType = 'text/html') {
  return new Response(body, { status, headers: { 'content-type': contentType } })
}

test('integration: heartbeat emits and timeouts trigger error', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      await new Promise((resolve) => setTimeout(resolve, 200))
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
      await new Promise((resolve) => setTimeout(resolve, 200))
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
  const stream = await openEventStream(server)
  const ready = JSON.parse((await stream.expectEvent('ready')).data)
  const heartbeat = await stream.expectEvent('heartbeat')
  const heartbeatPayload = JSON.parse(heartbeat.data)
  assert.equal(heartbeatPayload.connectionId, ready.connectionId)
  const payload = {
    connectionId: ready.connectionId,
    message: {
      jsonrpc: '2.0',
      id: 'req-timeout',
      method: 'tools/call',
      params: {
        name: 'transcript_yt',
        arguments: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
      }
    }
  }
  const res = await postMessage(server, payload)
  assert.equal(res.status, 202)
  let timeoutEvent
  const deadline = Date.now() + 2000
  while (Date.now() < deadline) {
    const evt = await stream.nextEvent()
    if (evt.event !== 'error') continue
    const payload = JSON.parse(evt.data)
    if (payload.requestId === 'req-timeout') {
      timeoutEvent = payload
      break
    }
  }
  assert.ok(timeoutEvent)
  assert.equal(timeoutEvent.code, 'timeout')
  await stream.close()
})
