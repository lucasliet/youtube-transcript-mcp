import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('Transport Switching Contract', () => {
  let registry
  let server

  before(() => {
    const config = createSdkServerConfig({ port: 3333 })
    server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
  })

  after(async () => {
    await registry?.close?.()
  })

  it('should initialize transport registry', () => {
    assert(registry, 'Transport registry should be created')
    assert(registry.activeTransports instanceof Map, 'Should expose active transports map')
  })

  it('should handle SSE transport endpoint correctly', () => {
    assert.equal(registry.isMcpEndpoint('/mcp'), true, 'Should handle /mcp as SSE endpoint')
    assert.equal(registry.isLegacySseEndpoint('/mcp/events'), true, 'Should handle legacy /mcp/events as SSE')
    assert.equal(registry.isLegacyMessageEndpoint('/mcp/messages'), true, 'Should handle legacy /mcp/messages as message endpoint')
    
    console.log('SSE transport endpoint handling validated')
  })

  it('should validate transport switching logic', () => {
    // Test endpoint detection logic
    const endpoints = [
      { path: '/mcp', type: 'primary' },
      { path: '/mcp/events', type: 'legacy-sse' },
      { path: '/mcp/messages', type: 'legacy-msg' },
      { path: '/invalid', type: 'none' }
    ]
    
    endpoints.forEach(({ path, type }) => {
      const isMcp = registry.isMcpEndpoint(path)
      const isLegacySse = registry.isLegacySseEndpoint(path)
      const isLegacyMsg = registry.isLegacyMessageEndpoint(path)
      
      switch(type) {
      case 'primary':
        assert.equal(isMcp, true, 'Should detect primary MCP endpoint')
        break
      case 'legacy-sse':
        assert.equal(isLegacySse, true, 'Should detect legacy SSE endpoint')
        break
      case 'legacy-msg':
        assert.equal(isLegacyMsg, true, 'Should detect legacy message endpoint')
        break
      case 'none':
        assert.equal(isMcp || isLegacySse || isLegacyMsg, false, 'Should not detect invalid endpoint')
        break
      }
    })
    
    console.log('Transport switching logic validated')
  })
})
