import test from 'node:test'
import assert from 'node:assert'
import { createServerConfig } from '../../src/server/config.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'

test('integration: performance guardrails preserved after SDK migration', () => {
  const legacyConfig = createServerConfig({})
  const sdkConfig = createSdkServerConfig({})

  assert.equal(sdkConfig.maxClients, legacyConfig.maxClients, 'Should keep maxClients aligned with legacy limit')
  assert.equal(sdkConfig.requestTimeoutMs, legacyConfig.requestTimeoutMs, 'Should retain request timeout for throughput parity')
  assert.equal(sdkConfig.heartbeatIntervalMs, legacyConfig.heartbeatIntervalMs, 'Should keep heartbeat interval to match legacy cadence')

  const server = createSdkServer(sdkConfig)
  const registry = new SdkTransportRegistry(sdkConfig, server)

  assert.equal(registry.config.maxClients, sdkConfig.maxClients, 'Registry should respect configured client cap')
  assert.equal(registry.config.requestTimeoutMs, sdkConfig.requestTimeoutMs, 'Registry should carry timeout configuration')
})
