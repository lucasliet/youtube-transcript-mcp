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

test('chooseTrack: uses default caption track index when matches absent', () => {
  const tracks = [
    { kind: 'standard', languageCode: 'de', baseUrl: 'u1' },
    { kind: 'standard', languageCode: 'it', baseUrl: 'u2&fmt=srv3' }
  ]
  const picked = __testables.chooseTrack(tracks, ['fr'], 1, undefined)
  assert.deepEqual(picked, { url: 'u2', lang: 'it' })
})

test('chooseTrack: uses translation source fallback when default index missing', () => {
  const tracks = [
    { kind: 'standard', languageCode: 'pt', baseUrl: 'manual1' },
    { kind: 'asr', languageCode: 'pt', baseUrl: 'asr1' },
    { kind: 'standard', languageCode: 'es', baseUrl: 'manual2&fmt=srv3' }
  ]
  const picked = __testables.chooseTrack(tracks, ['fr'], undefined, [2])
  assert.deepEqual(picked, { url: 'manual2', lang: 'es' })
})

test('chooseTrack: falls back to first manual when no other selection possible', () => {
  const tracks = [
    { kind: 'standard', languageCode: 'ja', baseUrl: 'manual' }
  ]
  const picked = __testables.chooseTrack(tracks, ['fr'], undefined, undefined)
  assert.deepEqual(picked, { url: 'manual', lang: 'ja' })
})

test('chooseTrack: falls back to first asr when manual unavailable', () => {
  const tracks = [
    { kind: 'asr', languageCode: 'de', baseUrl: 'asr&fmt=srv3' }
  ]
  const picked = __testables.chooseTrack(tracks, ['pt'], undefined, undefined)
  assert.deepEqual(picked, { url: 'asr', lang: 'de' })
})
