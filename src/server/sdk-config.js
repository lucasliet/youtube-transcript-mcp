import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createServerConfig } from './config.js'
import { McpServer } from './mcp-server.js'

export function createSdkServerConfig(overrides = {}) {
  const baseConfig = createServerConfig({ ...overrides, mode: 'remote' })
  
  return {
    ...baseConfig,
    transports: {
      sse: SSEServerTransport
    },
    serverInfo: {
      name: 'youtube-transcript-mcp',
      version: '2.0.2'
    },
    capabilities: {
      tools: {}
    }
  }
}

export function createSdkServer(config) {
  return new McpServer(config.serverInfo, {
    capabilities: config.capabilities
  })
}
