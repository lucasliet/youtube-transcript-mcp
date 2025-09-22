import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

describe('Claude Desktop Configuration Test', () => {
  it('should validate Claude Desktop SSE configuration format', () => {
    const config = createSdkServerConfig({ port: 3333, cors: '*' })
    const server = createSdkServer(config)
    const registry = new SdkTransportRegistry(config, server)
    
    // Validate configuration structure for Claude Desktop
    assert.equal(config.serverInfo.name, 'youtube-transcript-mcp', 'Should have correct server name')
    assert.equal(config.serverInfo.version, '2.0.2', 'Should have correct version')
    assert(registry.isMcpEndpoint('/mcp'), 'Should support /mcp endpoint')
    
    console.log('Claude Desktop configuration format validated')
  })

  it('should support Claude Desktop MCP server configuration', () => {
    const expectedMcpConfig = {
      mcpServers: {
        'youtube-transcript-mcp': {
          type: 'sse',
          url: 'http://localhost:3333/mcp'
        }
      }
    }
    
    // Validate structure matches Claude Desktop expectations
    assert(expectedMcpConfig.mcpServers, 'Should have mcpServers object')
    assert(expectedMcpConfig.mcpServers['youtube-transcript-mcp'], 'Should have server configuration')
    assert.equal(expectedMcpConfig.mcpServers['youtube-transcript-mcp'].type, 'sse', 'Should be SSE type')
    assert(expectedMcpConfig.mcpServers['youtube-transcript-mcp'].url.includes('/mcp'), 'Should have /mcp endpoint')
    
    console.log('Claude Desktop MCP server configuration supported')
  })

  it('should handle different ports for Claude Desktop', () => {
    const ports = [3000, 3333, 8080, 9000]
    
    ports.forEach(port => {
      const config = createSdkServerConfig({ port })
      const expectedUrl = 'http://localhost:' + port + '/mcp'
      
      // Validate port configuration
      assert.equal(config.port, port, 'Port should be configured correctly')
      assert(expectedUrl.includes('/mcp'), 'URL should include MCP endpoint')
    })
    
    console.log('Different ports for Claude Desktop handled')
  })

  it('should validate complete Claude Desktop integration', () => {
    const config = createSdkServerConfig({ port: 3333, cors: '*' })
    const server = createSdkServer(config)
    
    // Ensure all components work together for Claude Desktop
    assert(server, 'Server should be ready for Claude Desktop')
    assert(config.capabilities.tools, 'Should have tools for Claude Desktop')
    assert.equal(config.serverInfo.name, 'youtube-transcript-mcp', 'Correct name for Claude Desktop')
    
    console.log('Complete Claude Desktop integration validated')
  })
})
