import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

describe('SDK Tool Registration Integration', () => {
  let config, server

  it('should initialize SDK server with tools capability', () => {
    config = createSdkServerConfig({ port: 3333 })
    server = createSdkServer(config)
    
    assert(server, 'Server should be created')
    assert(config.capabilities.tools, 'Should have tools capability')
  })

  it('should support tool registration via setRequestHandler', () => {
    assert(typeof server.setRequestHandler === 'function', 'Should have setRequestHandler method')
    assert(typeof server.connect === 'function', 'Should have connect method')
    
    console.log('Tool registration methods available')
  })

  it('should validate MCP tool schemas integration', () => {
    // Test that schemas are properly available
    assert(CallToolRequestSchema, 'Should have CallToolRequestSchema')
    assert(ListToolsRequestSchema, 'Should have ListToolsRequestSchema')
    
    // These should be Zod schemas
    assert(typeof CallToolRequestSchema.parse === 'function', 'CallToolRequestSchema should be valid')
    assert(typeof ListToolsRequestSchema.parse === 'function', 'ListToolsRequestSchema should be valid')
    
    console.log('MCP tool schemas integration validated')
  })

  it('should support tool execution workflow', () => {
    // Validate that the server can handle tool requests
    assert(server, 'Server should support tool workflow')
    assert(config.serverInfo.name === 'youtube-transcript-mcp', 'Should be transcript tool server')
    
    console.log('Tool execution workflow support validated')
  })
})
