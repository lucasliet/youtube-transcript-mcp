import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

describe('Backwards Compatibility Contract', () => {
  let registry

  it('should initialize registry for backwards compatibility', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
    
    assert(registry, 'Registry should be created')
  })

  it('should support legacy endpoints', () => {
    assert.equal(registry.isLegacySseEndpoint('/mcp/events'), true, 'Should recognize legacy /mcp/events')
    assert.equal(registry.isLegacyMessageEndpoint('/mcp/messages'), true, 'Should recognize legacy /mcp/messages')
    assert.equal(registry.isMcpEndpoint('/mcp'), true, 'Should recognize modern /mcp')
    
    console.log('Legacy endpoints backwards compatibility validated')
  })
})
