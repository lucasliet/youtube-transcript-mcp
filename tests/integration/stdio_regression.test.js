import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

test('integration: stdio mode path still returns transcript', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
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
              { kind: 'standard', languageCode: 'en', baseUrl: 'https://example/stdio' }
            ],
            audioTracks: [ { defaultCaptionTrackIndex: 0 } ]
          }
        }
      }), 'application/json')
    }
    if (url === 'https://example/stdio') {
      return mkResponse(200, '<transcript><text start="0.0" dur="0.5">Hello stdio</text></transcript>')
    }
    return mkResponse(404, '')
  }

  try {
    const res = await transcriptYt({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    assert.equal(res?.[0]?.text, 'Hello stdio')
  } finally {
    globalThis.fetch = originalFetch
  }
})
