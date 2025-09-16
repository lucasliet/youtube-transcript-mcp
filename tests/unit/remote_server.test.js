import test from 'node:test'
import assert from 'node:assert/strict'
import { createServerConfig } from '../../src/server/config.js'
import { SessionRegistry } from '../../src/server/sessionRegistry.js'

const noopLog = () => {}

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

test('session registry: enforces max client limit', () => {
  const config = createServerConfig({ mode: 'remote', maxClients: 1 })
  const registry = new SessionRegistry(config, noopLog)
  const session = registry.create(mockResponse())
  assert.ok(session)
  assert.equal(registry.canAccept(), false)
  registry.delete(session.connectionId)
  assert.equal(registry.canAccept(), true)
})

function mockResponse() {
  return {
    headers: {},
    writeHead() {},
    write() {},
    end() {}
  }
}
