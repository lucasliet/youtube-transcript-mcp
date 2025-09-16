import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage } from '../helpers/remoteFixtures.js'

const noop = async () => {}

test('contract: relays MCP list tools request', async (t) => {
  const server = await startRemoteServer({ port: 0 })
  t.after(async () => {
    await server.close().catch(noop)
  })
  const stream = await openEventStream(server)
  const ready = await stream.expectEvent('ready')
  const readyPayload = JSON.parse(ready.data)
  const payload = {
    connectionId: readyPayload.connectionId,
    message: {
      jsonrpc: '2.0',
      id: 'req-1',
      method: 'tools/list',
      params: {}
    }
  }
  const res = await postMessage(server, payload)
  assert.equal(res.status, 202)
  const evt = await stream.expectEvent('message')
  const data = JSON.parse(evt.data)
  assert.equal(data.connectionId, readyPayload.connectionId)
  assert.equal(data.requestId, 'req-1')
  assert.equal(data.response?.jsonrpc, '2.0')
  assert.ok(Array.isArray(data.response?.result?.tools))
  await stream.close()
})
