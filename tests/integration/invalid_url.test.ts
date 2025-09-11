import test from 'node:test'
import assert from 'node:assert/strict'
import { transcriptYt } from '../../src/tool/transcriptYt.js'

test('integration: invalid URL returns null', async () => {
  const res = await transcriptYt({ videoUrl: 'https://example.com/watch?v=xyz' })
  assert.equal(res, null)
})
