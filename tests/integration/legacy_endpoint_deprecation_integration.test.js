import { after, before, describe, it } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { registerTranscriptTool } from '../../src/server/register-transcript-tool.js'
import { skipIfCannotBindLoopback } from '../helpers/env.js'

describe('Legacy Endpoint Migration', () => {
  let registry
  let baseUrl

  before(async (t) => {
    if (!await skipIfCannotBindLoopback(t)) return
    const config = createSdkServerConfig({ port: 0, host: '127.0.0.1' })
    const server = createSdkServer(config)
    registerTranscriptTool(server)
    registry = new SdkTransportRegistry(config, server)
    const info = await registry.start()
    baseUrl = info.baseUrl
  })

  after(async () => {
    if (registry) {
      await registry.close()
    }
  })

  it('should return migration guidance for legacy SSE endpoint', async () => {
    const response = await fetch(baseUrl + '/mcp/events', { headers: { Accept: 'text/event-stream' } })
    assert.equal(response.status, 404, 'Legacy SSE endpoint should return 404')
    const payload = await response.json()
    assert.equal(payload.error.code, 'endpoint_deprecated', 'Should mark endpoint as deprecated')
    assert.equal(payload.error.migration.oldEndpoint, '/mcp/events', 'Migration guidance should include old endpoint')
    assert.equal(payload.error.migration.newEndpoint, '/mcp', 'Migration guidance should include new endpoint')
  })

  it('should return migration guidance for legacy message endpoint', async () => {
    const response = await fetch(baseUrl + '/mcp/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    })
    assert.equal(response.status, 404, 'Legacy message endpoint should return 404')
    const payload = await response.json()
    assert.equal(payload.error.code, 'endpoint_deprecated', 'Should mark endpoint as deprecated')
    assert.equal(payload.error.migration.oldEndpoint, '/mcp/messages', 'Migration guidance should include old endpoint')
    assert.equal(payload.error.migration.method, 'POST', 'Migration guidance should specify HTTP method')
  })
})
