import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage } from '../helpers/remoteFixtures.js'

const noop = async () => {}

test.skip('contract: propagates tool errors as SSE error events - LEGACY TEST', async (t) => {
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
      id: 'req-error',
      method: 'tools/call',
      params: {
        name: 'transcript_yt',
        arguments: {
          videoUrl: 'https://invalid.example'
        }
      }
    }
  }
  const res = await postMessage(server, payload)
  assert.equal(res.status, 202)
  const evt = await stream.expectEvent('error')
  const data = JSON.parse(evt.data)
  assert.equal(data.connectionId, readyPayload.connectionId)
  assert.equal(data.requestId, 'req-error')
  assert.ok(['invalid_request', 'tool_error', 'inaccessible', 'other_error'].includes(data.code))
  assert.ok(data.message)
  await stream.close()
})
