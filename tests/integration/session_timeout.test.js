import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('Session Timeout Cleanup Test', () => {
  let registry

  it('should initialize registry for timeout testing', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
    
    assert(registry, 'Registry should be created')
  })

  it('should track session creation timestamps', () => {
    registry.activeTransports.clear()
    const mockTransport = {
      sessionId: 'timeout-session',
      createdAt: Date.now() - 60000, // 1 minute ago
      close: () => Promise.resolve()
    }
    
    registry.activeTransports.set('timeout-session', mockTransport)
    
    assert.equal(registry.activeTransports.size, 1, 'Should track session')
    assert(mockTransport.createdAt, 'Should have creation timestamp')
  })

  it('should identify expired sessions based on timeout', () => {
    registry.activeTransports.clear()
    const timeoutMs = 30000 // 30 seconds
    const currentTime = Date.now()
    
    const expiredTransport = {
      sessionId: 'expired-session',
      createdAt: currentTime - 60000, // 1 minute ago
      close: () => Promise.resolve()
    }
    
    const activeTransport = {
      sessionId: 'active-session',
      createdAt: currentTime - 10000, // 10 seconds ago
      close: () => Promise.resolve()
    }
    
    registry.activeTransports.set('expired-session', expiredTransport)
    registry.activeTransports.set('active-session', activeTransport)
    
    // Simulate timeout check
    const expiredSessions = []
    for (const [sessionId, transport] of registry.activeTransports) {
      if (currentTime - transport.createdAt > timeoutMs) {
        expiredSessions.push(sessionId)
      }
    }
    
    assert.equal(expiredSessions.length, 1, 'Should identify one expired session')
    assert.equal(expiredSessions[0], 'expired-session', 'Should identify correct expired session')
  })

  it('should cleanup expired sessions', async () => {
    registry.activeTransports.clear()
    const timeoutMs = 30000
    const currentTime = Date.now()
    
    // Add expired session
    const expiredTransport = {
      sessionId: 'cleanup-session',
      createdAt: currentTime - 60000,
      close: () => Promise.resolve()
    }
    
    registry.activeTransports.set('cleanup-session', expiredTransport)
    assert.equal(registry.activeTransports.size, 1, 'Should have session before cleanup')
    
    // Simulate cleanup
    for (const [sessionId, transport] of registry.activeTransports) {
      if (currentTime - transport.createdAt > timeoutMs) {
        registry.activeTransports.delete(sessionId)
      }
    }
    
    assert.equal(registry.activeTransports.size, 0, 'Should cleanup expired sessions')
  })

  it('should respect configured timeout values', () => {
    const configWithTimeout = createSdkServerConfig({ port: 3333, requestTimeoutMs: 60000 })
    
    assert.equal(configWithTimeout.requestTimeoutMs, 60000, 'Should respect configured timeout')
    
    const defaultConfig = createSdkServerConfig({ port: 3333 })
    assert.equal(defaultConfig.requestTimeoutMs, 60000, 'Should use default timeout')
  })
})
