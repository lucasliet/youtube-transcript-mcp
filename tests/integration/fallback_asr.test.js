import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: falls back to ASR when manual missing', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      const body = JSON.stringify({
        playabilityStatus: { status: 'OK' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [ { kind: 'asr', languageCode: 'en', baseUrl: 'https://example/track_en_asr' } ],
            audioTracks: [ { defaultCaptionTrackIndex: 0 } ]
          }
        }
      })
      return mkResponse(200, body, 'application/json')
    }
    if (url === 'https://example/track_en_asr') {
      return mkResponse(200, '<transcript><text start="0.0" dur="1.5">Hello</text></transcript>')
    }
    return mkResponse(404, 'not found')
  })

  const res = await transcriptYt({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ', preferredLanguages: ['pt-BR', 'en'] })
  assert.ok(Array.isArray(res))
  assert.equal(res?.[0].text, 'Hello')

  globalThis.fetch = originalFetch
})

function mkResponse(status, body, contentType = 'text/html') {
  return new Response(body, { status, headers: { 'content-type': contentType } })
}

