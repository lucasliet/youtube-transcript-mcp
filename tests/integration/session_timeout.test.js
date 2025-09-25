import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('Session Timeout Cleanup Test', () => {
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

  it('should initialize registry for timeout testing', () => {
    assert(registry, 'Registry should be created')
  })

  it('should track session creation timestamps', () => {
    registry.activeTransports.clear()
    const mockTransport = {
      type: 'streamable',
      sessionId: 'timeout-session',
      createdAt: Date.now() - 60000, // 1 minute ago
      transport: { close: () => Promise.resolve() }
    }

    registry.activeTransports.set('timeout-session', mockTransport)

    assert.equal(registry.activeTransports.size, 1, 'Should track session')
    assert(mockTransport.createdAt, 'Should have creation timestamp')
  })

  it('should identify expired sessions based on timeout', () => {
    registry.activeTransports.clear()
    const timeoutMs = 30000 // 30 seconds
    const currentTime = Date.now()

    registry.activeTransports.set('expired-session', {
      type: 'streamable',
      sessionId: 'expired-session',
      createdAt: currentTime - 60000,
      transport: { close: () => Promise.resolve() }
    })
    registry.activeTransports.set('active-session', {
      type: 'streamable',
      sessionId: 'active-session',
      createdAt: currentTime - 10000,
      transport: { close: () => Promise.resolve() }
    })

    const expiredSessions = registry.cleanupExpiredSessions(timeoutMs)

    assert.equal(expiredSessions.length, 1, 'Should identify one expired session')
    assert.equal(expiredSessions[0], 'expired-session', 'Should identify correct expired session')
  })

  it('should cleanup expired sessions', async () => {
    registry.activeTransports.clear()
    const timeoutMs = 30000
    const currentTime = Date.now()

    registry.activeTransports.set('cleanup-session', {
      type: 'streamable',
      sessionId: 'cleanup-session',
      createdAt: currentTime - 60000,
      transport: { close: () => Promise.resolve() }
    })
    assert.equal(registry.activeTransports.size, 1, 'Should have session before cleanup')

    const expiredSessions = registry.cleanupExpiredSessions(timeoutMs)

    assert.equal(registry.activeTransports.size, 0, 'Should cleanup expired sessions')
    assert.deepEqual(expiredSessions, ['cleanup-session'], 'Should report cleaned sessions')
  })

  it('should respect configured timeout values', () => {
    const configWithTimeout = createSdkServerConfig({ port: 3333, requestTimeoutMs: 60000 })

    assert.equal(configWithTimeout.requestTimeoutMs, 60000, 'Should respect configured timeout')

    const defaultConfig = createSdkServerConfig({ port: 3333 })
    assert.equal(defaultConfig.requestTimeoutMs, 60000, 'Should use default timeout')
  })
})
