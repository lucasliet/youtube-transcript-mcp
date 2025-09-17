import test from 'node:test'
import assert from 'node:assert/strict'
import { startRemoteServer, openEventStream, postMessage } from '../helpers/remoteFixtures.js'

const noop = async () => {}

test.skip('integration: remote invalid url yields error event - LEGACY TEST', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : String(input?.url || '')
    if (url.startsWith('https://www.youtube.com/watch')) {
      return new globalThis.Response('<html></html>', { status: 200 })
    }
    if (typeof originalFetch === 'function') {
      return originalFetch(input, init)
    }
    return new globalThis.Response('', { status: 404 })
  }

  const server = await startRemoteServer({ port: 0 })
  t.after(async () => {
    globalThis.fetch = originalFetch
    await server.close().catch(noop)
  })
  const stream = await openEventStream(server)
  const ready = JSON.parse((await stream.expectEvent('ready')).data)
  const payload = {
    connectionId: ready.connectionId,
    message: {
      jsonrpc: '2.0',
      id: 'req-invalid',
      method: 'tools/call',
      params: {
        name: 'transcript_yt',
        arguments: { videoUrl: 'https://invalid' }
      }
    }
  }
  const res = await postMessage(server, payload)
  assert.equal(res.status, 202)
  const evt = await stream.expectEvent('error')
  const data = JSON.parse(evt.data)
  assert.equal(data.requestId, 'req-invalid')
  assert.ok(data.message)
  await stream.close()
})
