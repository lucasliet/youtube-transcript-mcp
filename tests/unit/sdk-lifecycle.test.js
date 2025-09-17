import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

describe('SDK Components', () => {
  it('should create SDK server config', () => {
    const config = createSdkServerConfig({ port: 3333 })
    assert(config.serverInfo.name === 'youtube-transcript-mcp', 'Should have correct server name')
    assert(config.serverInfo.version === '2.0.1', 'Should have correct version')
    assert(config.capabilities.tools, 'Should have tools capability')
    console.log('SDK config created successfully')
  })

  it('should create SDK server instance', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    assert(server, 'Server should be created')
    assert(typeof server.connect === 'function', 'Server should have connect method')
    console.log('SDK server instance created successfully')
  })

  it('should create transport registry', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    const registry = new SdkTransportRegistry(config, server)
    assert(registry, 'Registry should be created')
    assert(typeof registry.start === 'function', 'Registry should have start method')
    assert(typeof registry.close === 'function', 'Registry should have close method')
    console.log('Transport registry created successfully')
  })
})
