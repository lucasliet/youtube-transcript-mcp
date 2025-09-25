import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: duplicate segments removed', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (input) => {
      const url = typeof input === 'string' ? input : String(input?.url || '')
      if (url.startsWith('https://www.youtube.com/watch')) {
        return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
      }
      if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
        const body = JSON.stringify({
          playabilityStatus: { status: 'OK' },
          captions: {
            playerCaptionsTracklistRenderer: {
              captionTracks: [
                { kind: 'standard', languageCode: 'en', baseUrl: 'https://example/track_en' }
              ],
              audioTracks: [{ defaultCaptionTrackIndex: 0 }]
            }
          }
        })
        return mkResponse(200, body, 'application/json')
      }
      if (url === 'https://example/track_en') {
        return mkResponse(200, '<transcript><text start="0.0" dur="1.0">Hi</text><text start="0.0" dur="1.0">Hi</text></transcript>')
      }
      return mkResponse(404, 'not found')
    }

    const res = await transcriptYt({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    assert.ok(Array.isArray(res))
    assert.equal(res?.length, 1)
    assert.deepEqual(res?.[0], { text: 'Hi', startInMs: 0, duration: 1000 })
  } finally {
    globalThis.fetch = originalFetch
  }
})

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}
