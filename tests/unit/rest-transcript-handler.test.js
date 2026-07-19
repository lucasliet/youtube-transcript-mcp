import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { handleTranscriptRequest } from '../../src/server/rest-transcript-handler.js'

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

function makeImpl(returnValue) {
  let lastCall = null
  const fn = async (args) => {
    lastCall = args
    return returnValue
  }
  fn.lastCall = () => lastCall
  return fn
}

describe('handleTranscriptRequest', () => {
  it('returns 400 invalid_request when videoUrl is missing', async () => {
    const impl = makeImpl([])
    const result = await handleTranscriptRequest('/transcript', { transcriptImpl: impl })

    assert.equal(result.status, 400)
    assert.equal(result.body.error.code, 'invalid_request')
    assert.equal(impl.lastCall(), null, 'transcript impl must not be invoked')
  })

  it('returns 400 invalid_request when videoUrl cannot be parsed to an id', async () => {
    const impl = makeImpl([])
    const result = await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent('https://invalid.example'),
      { transcriptImpl: impl }
    )

    assert.equal(result.status, 400)
    assert.equal(result.body.error.code, 'invalid_request')
    assert.equal(impl.lastCall(), null, 'transcript impl must not be invoked')
  })

  it('returns 200 with empty segments when transcript returns []', async () => {
    const impl = makeImpl([])
    const result = await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent(VALID_URL),
      { transcriptImpl: impl }
    )

    assert.equal(result.status, 200)
    assert.deepEqual(result.body.segments, [])
    assert.equal(result.body.videoUrl, VALID_URL)
  })

  it('returns 502 transcript_unavailable when transcript returns null', async () => {
    const impl = makeImpl(null)
    const result = await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent(VALID_URL),
      { transcriptImpl: impl }
    )

    assert.equal(result.status, 502)
    assert.equal(result.body.error.code, 'transcript_unavailable')
  })

  it('returns 200 with segments when transcript resolves to an array', async () => {
    const segments = [{ text: 'Hello', startInMs: 0, duration: 1500 }]
    const impl = makeImpl(segments)
    const result = await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent(VALID_URL),
      { transcriptImpl: impl }
    )

    assert.equal(result.status, 200)
    assert.equal(result.body.error, undefined)
    assert.deepEqual(result.body.segments, segments)
    assert.equal(result.body.videoUrl, VALID_URL)
  })

  it('parses preferredLanguages CSV into array', async () => {
    const impl = makeImpl([])
    const result = await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent(VALID_URL)
      + '&preferredLanguages=' + encodeURIComponent('pt-BR,en'),
      { transcriptImpl: impl }
    )

    assert.equal(result.status, 200)
    assert.deepEqual(result.body.preferredLanguages, ['pt-BR', 'en'])
  })

  it('returns preferredLanguages as [] when not provided', async () => {
    const impl = makeImpl([])
    const result = await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent(VALID_URL),
      { transcriptImpl: impl }
    )

    assert.equal(result.status, 200)
    assert.deepEqual(result.body.preferredLanguages, [])
  })

  it('forwards videoUrl and parsed preferredLanguages to transcript impl', async () => {
    const impl = makeImpl([])
    await handleTranscriptRequest(
      '/transcript?videoUrl=' + encodeURIComponent(VALID_URL)
      + '&preferredLanguages=' + encodeURIComponent('pt-BR,en'),
      { transcriptImpl: impl }
    )

    assert.deepEqual(impl.lastCall(), { videoUrl: VALID_URL, preferredLanguages: ['pt-BR', 'en'] })
  })

  it('uses default transcriptYt when no override provided', async () => {
    // Just verify it does not throw on the export; full network path is covered elsewhere.
    const result = await handleTranscriptRequest('/transcript')
    assert.equal(result.status, 400)
  })
})
