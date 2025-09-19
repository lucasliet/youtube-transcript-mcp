import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream } from '../helpers/remoteFixtures.js'

const noop = async () => {}

test.skip('contract: SSE handshake returns ready event and headers - LEGACY TEST', async (t) => {
  const server = await startRemoteServer({ port: 0 })
  t.after(async () => {
    await server.close().catch(noop)
  })
  const stream = await openEventStream(server)
  const { response } = stream
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'text/event-stream')
  assert.equal(response.headers.get('cache-control'), 'no-cache')
  assert.equal(response.headers.get('connection'), 'keep-alive')
  const ready = await stream.expectEvent('ready')
  const payload = JSON.parse(ready.data)
  assert.match(payload.connectionId, /^[0-9a-fA-F-]{36}$/)
  assert.equal(payload.messageEndpoint, '/mcp/messages')
  await stream.close()
})
