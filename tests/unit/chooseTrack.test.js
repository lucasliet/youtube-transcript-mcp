import test from 'node:test'
import assert from 'node:assert/strict'
import { __testables } from '../../src/tool/transcriptYt.js'

test('chooseTrack: prefers manual in preferred language', () => {
  const tracks = [
    { kind: 'asr', languageCode: 'en', baseUrl: 'u1' },
    { kind: 'standard', languageCode: 'pt-BR', baseUrl: 'u2' }
  ]
  const picked = __testables.chooseTrack(tracks, ['pt-BR', 'en'], undefined, undefined)
  assert.deepEqual(picked, { url: 'u2', lang: 'pt-BR' })
})

test('chooseTrack: falls back to ASR when manual missing', () => {
  const tracks = [
    { kind: 'asr', languageCode: 'en', baseUrl: 'u1' }
  ]
  const picked = __testables.chooseTrack(tracks, ['en'], undefined, undefined)
  assert.deepEqual(picked, { url: 'u1', lang: 'en' })
})

test('chooseTrack: uses default indices when no preferred', () => {
  const tracks = [
    { kind: 'standard', languageCode: 'en', baseUrl: 'u1' },
    { kind: 'standard', languageCode: 'es', baseUrl: 'u2' }
  ]
  const picked = __testables.chooseTrack(tracks, [], 1, undefined)
  assert.deepEqual(picked, { url: 'u2', lang: 'es' })
})

