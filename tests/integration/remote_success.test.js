import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage } from '../helpers/remoteFixtures.js'

const noop = async () => {}

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

test.skip('integration: remote transcript success - LEGACY TEST', async (t) => {
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
              { baseUrl: 'https://example/pt', languageCode: 'pt-BR', kind: 'standard' }
            ],
            audioTracks: [{ defaultCaptionTrackIndex: 0 }]
          }
        }
      }), 'application/json')
    }
    if (url === 'https://example/pt') {
      return mkResponse(200, '<transcript><text start="0.0" dur="1.0">Olá remoto</text></transcript>')
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
  const stream = await openEventStream(server)
  const ready = await stream.expectEvent('ready')
  const { connectionId } = JSON.parse(ready.data)
  const payload = {
    connectionId,
    message: {
      jsonrpc: '2.0',
      id: 'req-success',
      method: 'tools/call',
      params: {
        name: 'transcript_yt',
        arguments: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          preferredLanguages: ['pt-BR']
        }
      }
    }
  }
  const res = await postMessage(server, payload)
  assert.equal(res.status, 202)
  const evt = await stream.expectEvent('message')
  const data = JSON.parse(evt.data)
  assert.equal(data.requestId, 'req-success')
  const content = JSON.parse(data.response?.result?.content?.[0]?.text || 'null')
  assert.ok(Array.isArray(content))
  assert.equal(content[0]?.text, 'Olá remoto')
  await stream.close()
})
