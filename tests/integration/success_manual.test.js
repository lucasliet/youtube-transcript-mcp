import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: returns segments from manual track in preferred language', async () => {
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    calls.push(url)
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      const body = JSON.stringify({
        playabilityStatus: { status: 'OK' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              { kind: 'standard', languageCode: 'pt-BR', baseUrl: 'https://example/track_pt' },
              { kind: 'asr', languageCode: 'en', baseUrl: 'https://example/track_en_asr' }
            ],
            audioTracks: [ { defaultCaptionTrackIndex: 0 } ]
          }
        }
      })
      return mkResponse(200, body, 'application/json')
    }
    if (url === 'https://example/track_pt') {
      return mkResponse(200, '<transcript><text start="0.0" dur="1.0">Olá</text></transcript>')
    }
    return mkResponse(404, 'not found')
  })

  const res = await transcriptYt({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', preferredLanguages: ['pt-BR', 'en'] })
  assert.ok(Array.isArray(res))
  assert.equal(res?.length, 1)
  assert.deepEqual(res?.[0], { text: 'Olá', startInMs: 0, duration: 1000 })

  globalThis.fetch = originalFetch
})

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

