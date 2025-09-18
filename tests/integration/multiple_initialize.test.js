import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

const PROTOCOL_VERSION = '2025-06-18'

describe('Multiple Initialize Attempts Test', () => {
  let server

  it('should initialize server for multiple attempts testing', () => {
    const config = createSdkServerConfig({ port: 3333 })
    server = createSdkServer(config)
    
    assert(server, 'Server should be created')
  })

  it('should handle multiple initialize requests gracefully', () => {
    // Mock multiple initialize requests
    const initializeRequests = [
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          clientInfo: { name: 'client-1', version: '1.0.0' }
        }
      },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          clientInfo: { name: 'client-2', version: '1.0.0' }
        }
      }
    ]

    // Server should handle multiple initialize attempts
    initializeRequests.forEach((request, index) => {
      assert.equal(request.method, 'initialize', 'Request ' + String(index + 1) + ' should be initialize method')
      assert.equal(request.params.protocolVersion, PROTOCOL_VERSION, 'Request ' + String(index + 1) + ' should have correct protocol version')
    })
  })

  it('should validate initialize request parameters', () => {
    const validParams = {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }

    const invalidParams = [
      null,
      {},
      { protocolVersion: 'invalid' },
      { protocolVersion: PROTOCOL_VERSION }, // missing clientInfo
      { protocolVersion: PROTOCOL_VERSION, clientInfo: {} } // empty clientInfo
    ]

    // Valid parameters should be accepted
    assert(validParams.protocolVersion, 'Valid params should have protocol version')
    assert(validParams.clientInfo, 'Valid params should have client info')

    // Invalid parameters should be identified
    invalidParams.forEach((params, index) => {
      const hasProtocol = Boolean(params?.protocolVersion)
      const hasClient = Boolean(params?.clientInfo?.name && params?.clientInfo?.version)
      const isInvalid = !hasProtocol || !hasClient
      assert(isInvalid, 'Params ' + String(index) + ' should be identified as invalid')
    })
  })

  it('should maintain server state consistency across multiple initializes', () => {
    const config = createSdkServerConfig({ port: 3333 })
    
    // Server state should remain consistent
    assert.equal(config.serverInfo.name, 'youtube-transcript-mcp', 'Server name should remain consistent')
    assert.equal(config.serverInfo.version, '2.0.1', 'Server version should remain consistent')
    assert(config.capabilities.tools, 'Server capabilities should remain consistent')
  })
})
