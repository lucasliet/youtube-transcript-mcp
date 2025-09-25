import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('SDK Session Management Contract', () => {
  let registry

  before(() => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
  })

  after(async () => {
    await registry?.close?.()
  })

  it('should initialize session registry', () => {
    assert(registry.activeTransports instanceof Map, 'Should have active transports map')
    assert.equal(registry.activeTransports.size, 0, 'Should start with no active transports')
  })

  it('should handle session ID extraction from headers', () => {
    const mockReq = {
      headers: { 'mcp-session-id': 'test-session-123' },
      url: '/mcp'
    }

    const sessionId = registry.extractSessionId(mockReq)
    assert.equal(sessionId, 'test-session-123', 'Should extract session ID from mcp-session-id header')
  })

  it('should support legacy x-session-id header', () => {
    const mockReq = {
      headers: { 'x-session-id': 'legacy-session-999' },
      url: '/mcp'
    }

    const sessionId = registry.extractSessionId(mockReq)
    assert.equal(sessionId, 'legacy-session-999', 'Should extract session ID from legacy header')
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
    const wrapper = { type: 'streamable', sessionId: 'session-1', createdAt: Date.now(), transport: { close: () => Promise.resolve() } }
    registry.activeTransports.set('session-1', wrapper)

    assert.equal(registry.activeTransports.size, 1, 'Should track active transport')
    assert.equal(registry.activeTransports.get('session-1'), wrapper, 'Should retrieve tracked transport')

    registry.activeTransports.delete('session-1')
    assert.equal(registry.activeTransports.size, 0, 'Should remove transport correctly')
  })
})
