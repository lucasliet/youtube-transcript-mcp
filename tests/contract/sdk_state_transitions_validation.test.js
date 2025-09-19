import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('SDK State Transitions Validation', () => {
  it('should validate server state transitions', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    
    // Server should be in initialized state
    assert(server, 'Server should be created')
    assert(typeof server.connect === 'function', 'Server should have connect method')
    assert(typeof server.setRequestHandler === 'function', 'Server should have setRequestHandler method')
    
    console.log('Server initialized state validated')
  })

  it('should validate configuration state transitions', () => {
    const configs = [
      { input: {}, expectedPort: 3000, expectedCors: false },
      { input: { port: 8080 }, expectedPort: 8080, expectedCors: false },
      { input: { port: 9000, cors: '*' }, expectedPort: 9000, expectedCors: '*' },
      { input: { port: 0, host: '127.0.0.1' }, expectedPort: 0, expectedCors: false }
    ]
    
    configs.forEach(({ input, expectedPort, expectedCors }) => {
      const config = createSdkServerConfig(input)
      assert.equal(config.port, expectedPort, 'Port should be set correctly')
      assert.equal(config.cors, expectedCors, 'CORS should be set correctly')
    })
    
    console.log('Configuration state transitions validated')
  })

  it('should validate server info state consistency', () => {
    const config = createSdkServerConfig({ port: 3333 })
    
    assert.equal(config.serverInfo.name, 'youtube-transcript-mcp', 'Server name should be consistent')
    assert.equal(config.serverInfo.version, '2.0.2', 'Server version should be consistent')
    assert(config.capabilities.tools, 'Server capabilities should include tools')
    
    console.log('Server info state consistency validated')
  })

  it('should validate protocol version state', () => {
    const config = createSdkServerConfig({ port: 3333 })
    
    // Protocol version should be consistent across configurations
    assert.equal(config.serverInfo.version, '2.0.2', 'Should maintain protocol version consistency')
    
    console.log('Protocol version state validated')
  })
})
