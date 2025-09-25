import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage, waitForEventType } from '../helpers/remoteFixtures.js'

const noop = async () => {}

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

test.skip('integration: remote handles multiple clients independently - LEGACY TEST', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      return mkResponse(200, JSON.stringify({
        playabilityStatus: { status: 'OK' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              { baseUrl: 'https://example/a', languageCode: 'en', kind: 'standard' }
            ],
            audioTracks: [{ defaultCaptionTrackIndex: 0 }]
          }
        }
      }), 'application/json')
    }
    if (url === 'https://example/a') {
      return mkResponse(200, '<transcript><text start="0.0" dur="0.5">Hello</text></transcript>')
    }
    if (typeof originalFetch === 'function') {
      return originalFetch(input, init)
    }
    throw new Error(`unexpected fetch ${url}`)
  }

  const server = await startRemoteServer({ port: 0 })
  t.after(async () => {
    globalThis.fetch = originalFetch
    await server.close().catch(noop)
  })
  const streamA = await openEventStream(server)
  const streamB = await openEventStream(server)
  const readyA = JSON.parse((await streamA.expectEvent('ready')).data)
  const readyB = JSON.parse((await streamB.expectEvent('ready')).data)
  const payload = (connectionId, id) => ({
    connectionId,
    message: {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: 'transcript_yt', arguments: { videoUrl: id === 'req-a' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : 'https://www.youtube.com/watch?v=oHg5SJYRHA0' } }
    }
  })
  const resA = await postMessage(server, payload(readyA.connectionId, 'req-a'))
  const resB = await postMessage(server, payload(readyB.connectionId, 'req-b'))
  assert.equal(resA.status, 202)
  assert.equal(resB.status, 202)
  const evtA = await waitForEventType(streamA, 'message')
  const evtB = await waitForEventType(streamB, 'message')
  assert.equal(JSON.parse(evtA.data).requestId, 'req-a')
  assert.equal(JSON.parse(evtB.data).requestId, 'req-b')
  await streamA.close()
  await streamB.close()
})
