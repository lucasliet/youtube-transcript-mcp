import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('SDK Session Management Contract', () => {
  let registry

  it('should initialize session registry', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
    
    assert(registry.activeTransports instanceof Map, 'Should have active transports map')
    assert.equal(registry.activeTransports.size, 0, 'Should start with no active transports')
  })

  it('should handle session ID extraction from headers', () => {
    const mockReq = {
      headers: { 'x-session-id': 'test-session-123' },
      url: '/mcp'
    }
    
    const sessionId = registry.extractSessionId(mockReq)
    assert.equal(sessionId, 'test-session-123', 'Should extract session ID from x-session-id header')
  })

  it('should handle session ID extraction from query parameters', () => {
    const mockReq = {
      headers: {},
      url: '/mcp?sessionId=query-session-456&other=param'
    }
    
    const sessionId = registry.extractSessionId(mockReq)
    assert.equal(sessionId, 'query-session-456', 'Should extract session ID from query parameter')
  })

  it('should return undefined for missing session ID', () => {
    const mockReq = {
      headers: {},
      url: '/mcp'
    }
    
    const sessionId = registry.extractSessionId(mockReq)
    assert.equal(sessionId, undefined, 'Should return undefined when no session ID')
  })

  it('should manage active transport tracking', () => {
    // Simulate adding transports
    const mockTransport1 = { sessionId: 'session-1' }
    const mockTransport2 = { sessionId: 'session-2' }
    
    registry.activeTransports.set('session-1', mockTransport1)
    registry.activeTransports.set('session-2', mockTransport2)
    
    assert.equal(registry.activeTransports.size, 2, 'Should track multiple active transports')
    assert.equal(registry.activeTransports.get('session-1'), mockTransport1, 'Should retrieve correct transport')
    
    // Simulate cleanup
    registry.activeTransports.delete('session-1')
    assert.equal(registry.activeTransports.size, 1, 'Should remove transport correctly')
    
    console.log('Active transport tracking validated')
  })
})
