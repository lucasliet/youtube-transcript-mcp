import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: returns null when no captions', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return mkResponse(200, '<html>"INNERTUBE_API_KEY":"abc123"</html>')
    }
    if (url.startsWith('https://www.youtube.com/youtubei/v1/player?key=')) {
      const body = JSON.stringify({ playabilityStatus: { status: 'OK' } })
      return mkResponse(200, body, 'application/json')
    }
    return mkResponse(404, 'not found')
  })

  const res = await transcriptYt({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  assert.equal(res, null)

  globalThis.fetch = originalFetch
})

function mkResponse(status, body, contentType = 'text/html') {
  return new globalThis.Response(body, { status, headers: { 'content-type': contentType } })
}

