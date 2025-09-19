import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('Transport Registry Unit Tests', () => {
  let registry

  it('should create transport registry', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)
    
    assert(registry, 'Registry should be created')
  })

  it('should validate endpoint detection', () => {
    assert.equal(registry.isMcpEndpoint('/mcp'), true, 'Should detect /mcp')
    assert.equal(registry.isLegacySseEndpoint('/mcp/events'), true, 'Should detect legacy SSE')
    assert.equal(registry.isLegacyMessageEndpoint('/mcp/messages'), true, 'Should detect legacy message')
    assert.equal(registry.isMcpEndpoint('/invalid'), false, 'Should not detect invalid')
  })

  it('should handle session ID extraction', () => {
    const req1 = { headers: { 'x-session-id': 'header-id' }, url: '/mcp' }
    const req2 = { headers: {}, url: '/mcp?sessionId=query-id' }
    const req3 = { headers: {}, url: '/mcp' }
    
    assert.equal(registry.extractSessionId(req1), 'header-id', 'Should extract from header')
    assert.equal(registry.extractSessionId(req2), 'query-id', 'Should extract from query')
    assert.equal(registry.extractSessionId(req3), undefined, 'Should return undefined')
  })
})
