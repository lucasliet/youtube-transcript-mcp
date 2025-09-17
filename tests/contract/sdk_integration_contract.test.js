import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

describe('SDK Integration Contract', () => {
  let config, server, registry

  it('should create complete SDK integration', () => {
    config = createSdkServerConfig({ port: 3333, cors: '*' })
    server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)

    // Validate complete integration
    assert(config.serverInfo, 'Should have server info')
    assert(config.capabilities.tools, 'Should have tools capability')
    assert(server.setRequestHandler, 'Should have setRequestHandler method')
    assert(registry.start, 'Should have registry start method')
    assert(registry.handleSseConnection, 'Should have SSE connection handler')

    console.log('Complete SDK integration validated')
  })

  it('should validate MCP protocol schemas integration', () => {
    // Test that schemas are properly imported and available
    assert(CallToolRequestSchema, 'Should have CallToolRequestSchema')
    assert(ListToolsRequestSchema, 'Should have ListToolsRequestSchema')

    // These are Zod schemas from the SDK
    assert(typeof CallToolRequestSchema.parse === 'function', 'CallToolRequestSchema should be a valid Zod schema')
    assert(typeof ListToolsRequestSchema.parse === 'function', 'ListToolsRequestSchema should be a valid Zod schema')

    console.log('MCP protocol schemas integration validated')
  })

  it('should handle server initialization with proper capabilities', () => {
    const testConfig = createSdkServerConfig({ port: 8080 })
    const testServer = createSdkServer(testConfig)

    // Server should be initialized with correct capabilities
    assert.equal(testConfig.serverInfo.name, 'youtube-transcript-mcp', 'Server name should match')
    assert.equal(testConfig.serverInfo.version, '2.0.1', 'Server version should match')
    assert(testConfig.capabilities.tools, 'Should have tools capability')
    assert(testServer.setRequestHandler, 'Should expose request handler registration')

    console.log('Server initialization with capabilities validated')
  })
})
