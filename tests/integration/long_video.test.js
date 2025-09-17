import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: large transcript not truncated', async () => {
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
              audioTracks: [ { defaultCaptionTrackIndex: 0 } ]
            }
          }
        })
        return mkResponse(200, body, 'application/json')
      }
      if (url === 'https://example/track_en') {
        return mkResponse(200, mkTranscript(1000))
      }
      return mkResponse(404, 'not found')
    }

    const res = await transcriptYt({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    assert.ok(Array.isArray(res))
    assert.equal(res.length, 1000)
  } finally {
    globalThis.fetch = originalFetch
  }
})

/**
 * Creates a mock fetch response.
 * @param status HTTP status code.
 * @param body Response body.
 * @param contentType Response content type.
 * @returns Mocked Response.
 */
function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

/**
 * Generates a transcript XML with the given segment count.
 * @param count Number of segments.
 * @returns Transcript XML.
 */
function mkTranscript(count) {
  const parts = new Array(count)
  for (let i = 0; i < count; i++) {
    parts[i] = `<text start="${i}.0" dur="1.0">S${i}</text>`
  }
  return `<transcript>${parts.join('')}</transcript>`
}
