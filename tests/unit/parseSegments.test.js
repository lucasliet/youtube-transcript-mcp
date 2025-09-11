import test from 'node:test'
import assert from 'node:assert/strict'
import { __testables } from '../../src/tool/transcriptYt.js'

test('parseSegments: transcript/text format', () => {
  const xml = '<transcript><text start="0.0" dur="2.3">Hello &amp; welcome</text><text start="2.3" dur="1.8">World</text></transcript>'
  const segs = __testables.parseSegments(xml)
  assert.equal(segs.length, 2)
  assert.deepEqual(segs[0], { text: 'Hello & welcome', startInMs: 0, duration: 2300 })
  assert.deepEqual(segs[1], { text: 'World', startInMs: 2300, duration: 1800 })
})

test('parseSegments: timedtext/p format', () => {
  const xml = '<timedtext><body><p t="0" d="2300">Hello<s> </s>World</p><p t="2300" d="1800">Again</p></body></timedtext>'
  const segs = __testables.parseSegments(xml)
  assert.equal(segs.length, 2)
  assert.deepEqual(segs[0], { text: 'Hello World', startInMs: 0, duration: 2300 })
  assert.deepEqual(segs[1], { text: 'Again', startInMs: 2300, duration: 1800 })
})

