import test from 'node:test'
import assert from 'node:assert/strict'
import { __testables } from '../../src/tool/transcriptYt.js'

test('extractVideoId: valid full URL', () => {
  const id = __testables.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  assert.equal(id, 'dQw4w9WgXcQ')
})

test('extractVideoId: valid youtu.be short URL', () => {
  const id = __testables.extractVideoId('https://youtu.be/dQw4w9WgXcQ')
  assert.equal(id, 'dQw4w9WgXcQ')
})

test('extractVideoId: invalid URL', () => {
  const id = __testables.extractVideoId('https://example.com')
  assert.equal(id, null)
})

