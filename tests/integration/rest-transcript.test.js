import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startSdkRemoteServer } from '../../src/server/remote-server.js'
import { skipIfCannotBindLoopback } from '../helpers/env.js'

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const SAMPLE_SEGMENTS = [{ text: 'Olá', startInMs: 0, duration: 1500 }]

function buildUrl(base, query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? base + '/transcript?' + qs : base + '/transcript'
}

describe('REST /transcript endpoint', () => {
  let server
  let baseUrl

  before(async (t) => {
    const canBind = await skipIfCannotBindLoopback(t)
    if (!canBind) return undefined
    const fakeImpl = async (args) => {
      if (!args.preferredLanguages || args.preferredLanguages.length === 0) {
        return SAMPLE_SEGMENTS
      }
      if (args.preferredLanguages.includes('force-null')) {
        return null
      }
      return SAMPLE_SEGMENTS
    }
    server = await startSdkRemoteServer({
      port: 0,
      host: '127.0.0.1',
      cors: true,
      transcriptImpl: fakeImpl
    })
    baseUrl = server.baseUrl
    return undefined
  })

  after(async () => {
    if (server) await server.close()
  })

  it('returns 200 with segments on happy path', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(buildUrl(baseUrl, { videoUrl: VALID_URL }))
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body.segments, SAMPLE_SEGMENTS)
    assert.equal(body.videoUrl, VALID_URL)
    assert.deepEqual(body.preferredLanguages, [])
    return undefined
  })

  it('returns 200 with parsed preferredLanguages CSV', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(buildUrl(baseUrl, {
      videoUrl: VALID_URL,
      preferredLanguages: 'pt-BR,en'
    }))
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body.preferredLanguages, ['pt-BR', 'en'])
    return undefined
  })

  it('returns 400 when videoUrl is missing', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(buildUrl(baseUrl, {}))
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.error.code, 'invalid_request')
    return undefined
  })

  it('returns 400 when videoUrl is unparseable', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(buildUrl(baseUrl, { videoUrl: 'not-a-url' }))
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.error.code, 'invalid_request')
    return undefined
  })

  it('returns 502 transcript_unavailable when impl returns null', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(buildUrl(baseUrl, {
      videoUrl: VALID_URL,
      preferredLanguages: 'force-null'
    }))
    assert.equal(res.status, 502)
    const body = await res.json()
    assert.equal(body.error.code, 'transcript_unavailable')
    return undefined
  })

  it('returns 405 on POST /transcript', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(baseUrl + '/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    assert.equal(res.status, 405)
    return undefined
  })

  it('responds to OPTIONS with 204 and CORS headers when cors=true', async (t) => {
    if (!baseUrl) { t.skip('loopback unavailable'); return undefined }
    const res = await fetch(baseUrl + '/transcript', { method: 'OPTIONS' })
    assert.equal(res.status, 204)
    assert.equal(res.headers.get('access-control-allow-origin'), '*')
    assert.ok(res.headers.get('access-control-allow-methods').includes('GET'))
    return undefined
  })
})
