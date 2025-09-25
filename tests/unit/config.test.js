import test from 'node:test'
import assert from 'node:assert/strict'
import { createServerConfig, parseCliConfig } from '../../src/server/config.js'

test('createServerConfig normalizes overrides', () => {
  const config = createServerConfig({
    mode: 'remote',
    cors: 'https://allowed.example',
    allowedOrigins: ' https://origin.one , https://origin.two , ',
    allowedHosts: [' localhost ', '127.0.0.1'],
    enableDnsRebindingProtection: 'true'
  })

  assert.equal(config.mode, 'remote')
  assert.deepEqual(config.allowedOrigins, ['https://origin.one', 'https://origin.two'])
  assert.deepEqual(config.allowedHosts, ['localhost', '127.0.0.1'])
  assert.equal(config.cors, 'https://allowed.example')
  assert.equal(config.enableDnsRebindingProtection, true)
})

test('createServerConfig discards empty allowed lists and normalizes flags', () => {
  const config = createServerConfig({
    allowedOrigins: ['  '],
    allowedHosts: ' , ',
    enableDnsRebindingProtection: 'false'
  })

  assert.equal(config.allowedOrigins, undefined)
  assert.equal(config.allowedHosts, undefined)
  assert.equal(config.enableDnsRebindingProtection, false)
})

test('parseCliConfig converts string inputs and enforces numeric parsing', () => {
  const config = parseCliConfig({
    mode: 'remote',
    port: '8081',
    host: '127.0.0.1',
    cors: 'false',
    heartbeat: '30000',
    'request-timeout': '120000',
    'max-clients': '12'
  })

  assert.equal(config.mode, 'remote')
  assert.equal(config.port, 8081)
  assert.equal(config.host, '127.0.0.1')
  assert.equal(config.cors, false)
  assert.equal(config.heartbeatIntervalMs, 30000)
  assert.equal(config.requestTimeoutMs, 120000)
  assert.equal(config.maxClients, 12)
})

test('createServerConfig trims invalid host entries from overrides', () => {
  const config = createServerConfig({ allowedHosts: ['valid', ''] })
  assert.deepEqual(config.allowedHosts, ['valid'])
})
