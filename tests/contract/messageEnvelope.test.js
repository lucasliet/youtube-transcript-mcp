import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage } from '../helpers/remoteFixtures.js'

const noop = async () => {}

test('contract: POST /mcp/messages validates envelope', async (t) => {
  const server = await startRemoteServer({ port: 0 })
  t.after(async () => {
    await server.close().catch(noop)
  })
  const stream = await openEventStream(server)
  const ready = await stream.expectEvent('ready')
  const readyPayload = JSON.parse(ready.data)
  const res = await postMessage(server, { connectionId: readyPayload.connectionId })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.code, 'invalid_request')
  assert.ok(body.message)
  await stream.close()
})
