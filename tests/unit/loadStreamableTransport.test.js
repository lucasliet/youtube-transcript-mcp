import test from 'node:test'
import assert from 'node:assert/strict'
import { StreamableHTTPServerTransport } from '../../src/server/loadStreamableTransport.js'

test('loadStreamableTransport re-exports StreamableHTTPServerTransport from SDK', () => {
  assert.equal(typeof StreamableHTTPServerTransport, 'function')
  assert.equal(StreamableHTTPServerTransport.name, 'StreamableHTTPServerTransport')
})
