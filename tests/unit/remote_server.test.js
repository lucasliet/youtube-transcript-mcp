import test from 'node:test'
import assert from 'node:assert/strict'
import { createServerConfig } from '../../src/server/config.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

test('remote config: applies overrides and validates bounds', () => {
  const cfg = createServerConfig({ mode: 'remote', port: 8081, host: '127.0.0.1', heartbeatIntervalMs: 1000, requestTimeoutMs: 5000, maxClients: 3 })
  assert.equal(cfg.mode, 'remote')
  assert.equal(cfg.port, 8081)
  assert.equal(cfg.host, '127.0.0.1')
  assert.equal(cfg.heartbeatIntervalMs, 1000)
  assert.equal(cfg.requestTimeoutMs, 5000)
  assert.equal(cfg.maxClients, 3)
})

test('remote config: rejects invalid heartbeat/timeout combination', () => {
  assert.throws(() => createServerConfig({ mode: 'remote', heartbeatIntervalMs: 5000, requestTimeoutMs: 4000 }))
})

test('SDK remote config: creates valid SDK configuration', () => {
  const sdkCfg = createSdkServerConfig({ mode: 'remote', port: 8082, cors: '*' })
  assert.equal(sdkCfg.mode, 'remote')
  assert.equal(sdkCfg.port, 8082)
  assert.equal(sdkCfg.cors, '*')
  assert(sdkCfg.serverInfo, 'Should have server info')
  assert(sdkCfg.capabilities, 'Should have capabilities')
  assert.equal(sdkCfg.serverInfo.name, 'youtube-transcript-mcp', 'Should have correct server name')
})

test('SDK server: creates server instance with correct configuration', () => {
  const config = createSdkServerConfig({ port: 3333 })
  const server = createSdkServer(config)
  assert(server, 'Server should be created')
  assert(typeof server.connect === 'function', 'Server should have connect method')
  assert(typeof server.setRequestHandler === 'function', 'Server should have setRequestHandler method')
})
