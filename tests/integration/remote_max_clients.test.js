import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer } from '../helpers/remoteFixtures.js'
import { skipIfCannotBindLoopback } from '../helpers/env.js'

const noop = async () => {}

test('integration: rejects connections beyond maxClients', async (t) => {
  if (!await skipIfCannotBindLoopback(t)) return
  const server = await startRemoteServer({ port: 0, maxClients: 1 })
  const controllerA = new AbortController()
  t.after(async () => {
    controllerA.abort()
    await server.close().catch(noop)
  })

  const responseA = await globalThis.fetch(`${server.baseUrl}/mcp`, {
    headers: {
      Accept: 'text/event-stream',
      'MCP-Protocol-Version': '2025-06-18'
    },
    signal: controllerA.signal
  })
  assert.equal(responseA.status, 200, 'First client should establish SSE stream')

  const responseB = await globalThis.fetch(`${server.baseUrl}/mcp`, {
    headers: { Accept: 'text/event-stream', 'MCP-Protocol-Version': '2025-06-18' }
  })
  assert.equal(responseB.status, 429, 'Second client should be rejected with 429')
  const payload = await responseB.json()
  assert.equal(payload.error.code, 'too_many_clients', 'Response should include too_many_clients error code')
})
