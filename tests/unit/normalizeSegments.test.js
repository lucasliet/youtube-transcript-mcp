import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSegments } from '../../src/lib/normalizeSegments.js'

test('normalizeSegments: trims, dedups and sorts', () => {
  const segs = normalizeSegments([
    { text: 'B', startInMs: 2000, duration: 500 },
    { text: ' A ', startInMs: 0, duration: 1000 },
    { text: 'B', startInMs: 2000, duration: 500 },
    { text: ' ', startInMs: 1500, duration: 300 }
  ])
  assert.equal(segs.length, 2)
  assert.deepEqual(segs[0], { text: 'A', startInMs: 0, duration: 1000 })
  assert.deepEqual(segs[1], { text: 'B', startInMs: 2000, duration: 500 })
})

