import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('Legacy Endpoint Migration', () => {
  let registry

  it('should initialize registry for legacy testing', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
    
    assert(registry, 'Registry should be created')
  })

  it('should detect legacy endpoints', () => {
    assert.equal(registry.isLegacySseEndpoint('/mcp/events'), true, 'Should detect legacy /mcp/events')
    assert.equal(registry.isLegacyMessageEndpoint('/mcp/messages'), true, 'Should detect legacy /mcp/messages')
    assert.equal(registry.isMcpEndpoint('/mcp'), true, 'Should detect new /mcp endpoint')
    console.log('Legacy endpoint detection working')
  })
})
