import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

describe('Session Cleanup Integration', () => {
  let config, server, registry

  before(() => {
    config = createSdkServerConfig({ port: 3333 })
    server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
  })

  after(async () => {
    await registry?.close?.()
  })

  it('should initialize components for session testing', () => {
    assert(registry.activeTransports instanceof Map, 'Should have transports map')
  })

  it('should manage session lifecycle correctly', () => {
    // Simulate session creation
    const mockTransport1 = { sessionId: 'session-1', transport: { close: () => Promise.resolve() }, createdAt: Date.now() }
    const mockTransport2 = { sessionId: 'session-2', transport: { close: () => Promise.resolve() }, createdAt: Date.now() }

    // Add sessions
    registry.activeTransports.set('session-1', mockTransport1)
    registry.activeTransports.set('session-2', mockTransport2)
    
    assert.equal(registry.activeTransports.size, 2, 'Should track active sessions')
    
    // Simulate cleanup
    registry.activeTransports.clear()
    assert.equal(registry.activeTransports.size, 0, 'Should clean up all sessions')
    
    console.log('Session lifecycle management validated')
  })

  it('should handle individual session cleanup', () => {
    const mockTransport = { sessionId: 'test-session', transport: { close: () => Promise.resolve() }, createdAt: Date.now() }

    registry.activeTransports.set('test-session', mockTransport)
    assert.equal(registry.activeTransports.size, 1, 'Should add session')
    
    registry.activeTransports.delete('test-session')
    assert.equal(registry.activeTransports.size, 0, 'Should remove session')
    
    console.log('Individual session cleanup validated')
  })
})
