import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

describe('SDK Error Handling Contract', () => {
  let config, server, registry

  it('should initialize SDK components for error testing', () => {
    config = createSdkServerConfig({ port: 3333 })
    server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)

    assert(registry, 'Registry should be created for error testing')
    assert(server, 'Server should be created for error testing')
  })

  it('should handle invalid endpoint requests', () => {
    assert.equal(registry.isMcpEndpoint('/invalid'), false, '/invalid should not be MCP endpoint')
    assert.equal(registry.isMcpEndpoint('/mcp/invalid'), false, '/mcp/invalid should not be MCP endpoint')
    assert.equal(registry.isLegacySseEndpoint('/invalid'), false, 'should not be legacy SSE endpoint')
    assert.equal(registry.isLegacyMessageEndpoint('/invalid'), false, 'should not be legacy message endpoint')

    console.log('Invalid endpoint handling validated')
  })

  it('should validate MCP protocol compliance', () => {
    assert.equal(config.serverInfo.name, 'youtube-transcript-mcp', 'Should have MCP-compliant server name')
    assert.equal(config.serverInfo.version, '2.0.3', 'Should have version')
    assert(config.capabilities.tools, 'Should advertise tools capability')

    console.log('MCP protocol compliance validated')
  })
})
