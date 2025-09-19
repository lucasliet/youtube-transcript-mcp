import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: repeated calls perform fresh fetches (no cache)', async () => {
  let playerCalls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      playerCalls++
      const body = JSON.stringify({
        playabilityStatus: { status: 'OK' },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [ { kind: 'standard', languageCode: 'en', baseUrl: 'https://example/track_en' } ],
            audioTracks: [ { defaultCaptionTrackIndex: 0 } ]
          }
        }
      })
      return mkResponse(200, body, 'application/json')
    }
    if (url === 'https://example/track_en') {
      return mkResponse(200, '<transcript><text start="0.0" dur="1.0">Hi</text></transcript>')
    }
    return mkResponse(404, 'not found')
  })

  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  const a = await transcriptYt({ videoUrl: url })
  const b = await transcriptYt({ videoUrl: url })
  assert.equal(playerCalls >= 2, true)
  assert.ok(Array.isArray(a) && Array.isArray(b))

  globalThis.fetch = originalFetch
})

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

