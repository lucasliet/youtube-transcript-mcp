import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig } from '../../src/server/sdk-config.js'

describe('SDK Configuration Unit Tests', () => {
  it('should create default SDK configuration', () => {
    const config = createSdkServerConfig({})

    assert.equal(config.mode, 'remote', 'Should default to remote mode')
    assert.equal(config.port, 3000, 'Should use default port')
    assert.equal(config.host, '0.0.0.0', 'Should use default host')
    assert.equal(config.cors, false, 'Should disable CORS by default')
    assert.equal(config.heartbeatIntervalMs, 25000, 'Should use default heartbeat')
    assert.equal(config.requestTimeoutMs, 60000, 'Should use default timeout')
    assert.equal(config.maxClients, 10, 'Should use default max clients')
    assert.equal('streamable' in config.transports, true, 'Should expose streamable transport key')
    assert.ok(config.transports.sse, 'Should expose SSE transport')
    assert.equal(config.enableDnsRebindingProtection, false, 'Should disable DNS rebinding protection by default')
    assert.equal(config.allowedHosts, undefined, 'Should not set allowed hosts by default')
    assert.equal(config.allowedOrigins, undefined, 'Should not set allowed origins by default')
  })

  it('should override configuration values', () => {
    const overrides = {
      port: 8080,
      host: '127.0.0.1',
      cors: '*',
      heartbeatIntervalMs: 30000,
      requestTimeoutMs: 120000,
      maxClients: 5,
      allowedOrigins: ['https://example.com'],
      allowedHosts: '127.0.0.1',
      enableDnsRebindingProtection: true
    }

    const config = createSdkServerConfig(overrides)

    assert.equal(config.port, 8080, 'Should override port')
    assert.equal(config.host, '127.0.0.1', 'Should override host')
    assert.equal(config.cors, '*', 'Should override CORS')
    assert.equal(config.heartbeatIntervalMs, 30000, 'Should override heartbeat')
    assert.equal(config.requestTimeoutMs, 120000, 'Should override timeout')
    assert.equal(config.maxClients, 5, 'Should override max clients')
    assert.deepEqual(config.allowedOrigins, ['https://example.com'], 'Should normalize allowed origins list')
    assert.deepEqual(config.allowedHosts, ['127.0.0.1'], 'Should normalize allowed hosts list')
    assert.equal(config.enableDnsRebindingProtection, true, 'Should enable DNS rebinding protection when requested')
  })

  it('should validate configuration constraints', () => {
    // Valid configurations should not throw
    assert.doesNotThrow(() => createSdkServerConfig({ port: 8080 }))
    assert.doesNotThrow(() => createSdkServerConfig({ host: '127.0.0.1' }))
    assert.doesNotThrow(() => createSdkServerConfig({ cors: '*' }))

    // Invalid configurations should throw
    assert.throws(() => createSdkServerConfig({ port: -1 }), 'Should reject negative port')
    assert.throws(() => createSdkServerConfig({ port: 99999 }), 'Should reject invalid port')
    assert.throws(() => createSdkServerConfig({ host: '' }), 'Should reject empty host')
    assert.throws(() => createSdkServerConfig({ heartbeatIntervalMs: 0 }), 'Should reject zero heartbeat')
    assert.throws(() => createSdkServerConfig({ requestTimeoutMs: -1000 }), 'Should reject negative timeout')
    assert.throws(() => createSdkServerConfig({ maxClients: 0 }), 'Should reject zero max clients')
    assert.throws(() => createSdkServerConfig({ allowedOrigins: 123 }), 'Should reject invalid allowed origins')
    assert.throws(() => createSdkServerConfig({ allowedHosts: 42 }), 'Should reject invalid allowed hosts')
    assert.throws(() => createSdkServerConfig({ enableDnsRebindingProtection: 'invalid' }), 'Should reject invalid DNS rebinding flag')
  })

  it('should handle CORS configuration correctly', () => {
    const corsConfigs = [
      { input: { cors: false }, expected: false },
      { input: { cors: true }, expected: '*' },
      { input: { cors: '*' }, expected: '*' },
      { input: { cors: 'https://example.com' }, expected: 'https://example.com' }
    ]

    corsConfigs.forEach(({ input, expected }) => {
      const config = createSdkServerConfig(input)
      assert.equal(config.cors, expected, 'CORS config ' + JSON.stringify(input) + ' should result in ' + String(expected))
    })
  })

  it('should validate heartbeat and timeout relationship', () => {
    // Valid combinations should not throw
    assert.doesNotThrow(() => createSdkServerConfig({
      heartbeatIntervalMs: 10000,
      requestTimeoutMs: 30000
    }))

    // Invalid combinations should throw
    assert.throws(() => createSdkServerConfig({
      heartbeatIntervalMs: 60000,
      requestTimeoutMs: 30000
    }), 'Should reject heartbeat longer than timeout')
  })

  it('should provide consistent server info', () => {
    const config1 = createSdkServerConfig({})
    const config2 = createSdkServerConfig({ port: 8080 })

    assert.deepEqual(config1.serverInfo, config2.serverInfo, 'Server info should be consistent across configs')
    assert.equal(config1.serverInfo.name, 'youtube-transcript-mcp', 'Should have correct server name')
    assert.equal(config1.serverInfo.version, '2.0.3', 'Should have correct server version')
  })
})
