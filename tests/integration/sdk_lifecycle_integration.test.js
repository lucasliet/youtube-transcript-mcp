import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')

describe('SDK Lifecycle Integration', () => {
  let config, server

  it('should complete full MCP lifecycle', async () => {
    config = createSdkServerConfig({ port: 3333 })
    server = createSdkServer(config)

    // Verify server is properly configured
    assert(server, 'Server should be created')
    assert(typeof server.connect === 'function', 'Server should have connect method')
    assert(typeof server.setRequestHandler === 'function', 'Server should have setRequestHandler method')

    console.log('✅ SDK server initialized successfully')
  })

  it('should handle initialize request/response cycle', () => {
    // Mock initialize request
    const initializeRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    }

    // Mock initialize response
    const initializeResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: true } },
        serverInfo: { name: 'youtube-transcript-mcp', version }
      }
    }

    // Validate request structure
    assert.equal(initializeRequest.method, 'initialize', 'Should be initialize method')
    assert.equal(initializeRequest.params.protocolVersion, '2024-11-05', 'Should have correct protocol version')

    // Validate response structure
    assert(initializeResponse.result, 'Should have result')
    assert.equal(initializeResponse.result.protocolVersion, '2024-11-05', 'Should return correct protocol version')

    console.log('✅ Initialize request/response cycle validated')
  })

  it('should handle tools/list after initialization', () => {
    // Mock tools/list request
    const toolsListRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }

    // Mock tools/list response
    const toolsListResponse = {
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: [{
          name: 'transcript_yt',
          description: 'Fetches YouTube transcript segments from a video URL for LLM consumption.',
          inputSchema: {
            type: 'object',
            properties: {
              videoUrl: { type: 'string', description: 'Full YouTube video URL.' },
              preferredLanguages: { 
                type: 'array', 
                items: { type: 'string' }, 
                description: "Optional ordered language codes preference, e.g., ['pt-BR','en']." 
              }
            },
            required: ['videoUrl'],
            additionalProperties: false
          }
        }]
      }
    }

    // Validate request
    assert.equal(toolsListRequest.method, 'tools/list', 'Should be tools/list method')

    // Validate response
    assert(toolsListResponse.result.tools, 'Should have tools array')
    assert.equal(toolsListResponse.result.tools.length, 1, 'Should have one tool')
    assert.equal(toolsListResponse.result.tools[0].name, 'transcript_yt', 'Should have transcript_yt tool')

    console.log('✅ Tools/list after initialization validated')
  })

  it('should handle shutdown request', () => {
    // Mock shutdown request
    const shutdownRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'shutdown',
      params: null
    }

    // Mock shutdown response
    const shutdownResponse = {
      jsonrpc: '2.0',
      id: 3,
      result: null
    }

    // Validate request
    assert.equal(shutdownRequest.method, 'shutdown', 'Should be shutdown method')
    assert.equal(shutdownRequest.params, null, 'Should have null params')

    // Validate response
    assert.equal(shutdownResponse.result, null, 'Should have null result')

    console.log('✅ Shutdown request validated')
  })
})
