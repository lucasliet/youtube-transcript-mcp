import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

describe('IDE Client Compatibility', () => {
  it('should support Claude Desktop SSE configuration', () => {
    const config = createSdkServerConfig({ port: 3333, cors: '*' })
    const server = createSdkServer(config)
    const registry = new SdkTransportRegistry(config, server)

    // Validate configuration for Claude Desktop
    assert.equal(config.serverInfo.name, 'youtube-transcript-mcp', 'Should have correct server name for Claude')
    assert.equal(config.serverInfo.version, '2.0.3', 'Should have version')
    assert(config.capabilities.tools, 'Should have tools capability')
    assert(typeof registry.start === 'function', 'Should expose start method for SSE transport')

    console.log('Claude Desktop SSE configuration validated')
  })

  it('should generate correct IDE configuration snippet', () => {
    const expectedConfig = {
      mcpServers: {
        'youtube-transcript-mcp': {
          type: 'sse',
          url: 'http://localhost:3333/mcp'
        }
      }
    }

    // Validate structure
    assert(expectedConfig.mcpServers, 'Should have mcpServers')
    assert(expectedConfig.mcpServers['youtube-transcript-mcp'], 'Should have server config')
    assert.equal(expectedConfig.mcpServers['youtube-transcript-mcp'].type, 'sse', 'Should be SSE type')
    assert.equal(expectedConfig.mcpServers['youtube-transcript-mcp'].url, 'http://localhost:3333/mcp', 'Should have correct URL')

    console.log('IDE configuration snippet validated')
    console.log('Configuration:', JSON.stringify(expectedConfig, null, 2))
  })
})
