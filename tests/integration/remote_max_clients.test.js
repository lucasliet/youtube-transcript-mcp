import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream } from '../helpers/remoteFixtures.js'

const noop = async () => {}

test.skip('integration: rejects connections beyond maxClients - LEGACY TEST', async (t) => {
  const server = await startRemoteServer({ port: 0, maxClients: 1 })
  t.after(async () => {
    await server.close().catch(noop)
  })
  const stream = await openEventStream(server)
  await stream.expectEvent('ready')
  const res = await globalThis.fetch(`${server.baseUrl}/mcp/events`, {
    headers: { Accept: 'text/event-stream' }
  })
  assert.equal(res.status, 429)
  const payload = await res.json()
  assert.equal(payload.code, 'server_busy')
  await stream.close()
})
