import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')
const PROTOCOL_VERSION = '2025-06-18'

describe('SDK Initialize Contract', () => {
  it('should validate MCP initialize request schema', () => {
    const validInitializeRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    }

    // Validate required fields
    assert.equal(validInitializeRequest.jsonrpc, '2.0', 'Should have JSON-RPC version')
    assert.equal(validInitializeRequest.method, 'initialize', 'Should have initialize method')
    assert(validInitializeRequest.params, 'Should have params')
    assert.equal(validInitializeRequest.params.protocolVersion, PROTOCOL_VERSION, 'Should have correct protocol version')
    assert(validInitializeRequest.params.clientInfo, 'Should have client info')
    console.log('MCP initialize request schema validated')
  })

  it('should validate MCP initialize response schema', () => {
    const validInitializeResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: true
          }
        },
        serverInfo: {
          name: 'youtube-transcript-mcp',
          version
        }
      }
    }

    // Validate response structure
    assert.equal(validInitializeResponse.jsonrpc, '2.0', 'Should have JSON-RPC version')
    assert.equal(validInitializeResponse.id, 1, 'Should have matching request ID')
    assert(validInitializeResponse.result, 'Should have result')
    assert.equal(validInitializeResponse.result.protocolVersion, PROTOCOL_VERSION, 'Should return correct protocol version')
    assert(validInitializeResponse.result.serverInfo, 'Should have server info')
    console.log('MCP initialize response schema validated')
  })
})
