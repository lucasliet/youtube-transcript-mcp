import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { loadStreamableTransport, resetStreamableTransportCache } from '../../src/server/loadStreamableTransport.js'

test('loadStreamableTransport returns null when transport module missing', async () => {
  resetStreamableTransportCache()
  const transport = await loadStreamableTransport()
  assert.equal(transport, null)
})

test('loadStreamableTransport resolves available module and caches promise', async () => {
  resetStreamableTransportCache()
  const baseDir = path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'server')
  await fs.mkdir(baseDir, { recursive: true })
  const stubPath = path.join(baseDir, 'streamableHttp.js')
  await fs.writeFile(stubPath, 'export class StreamableHTTPServerTransport {}\n')

  try {
    const transport = await loadStreamableTransport()
    assert.equal(typeof transport, 'function')
    const again = await loadStreamableTransport()
    assert.equal(again, transport)
  } finally {
    resetStreamableTransportCache()
    await fs.rm(stubPath, { force: true })
  }
})
