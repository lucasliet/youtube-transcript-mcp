import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createServerConfig } from './config.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

export function createSdkServerConfig(overrides = {}) {
  const baseConfig = createServerConfig({ ...overrides, mode: 'remote' })
  
  return {
    ...baseConfig,
    transports: {
      sse: SSEServerTransport
    },
    serverInfo: {
      name: 'youtube-transcript-mcp',
      version: '2.0.1'
    },
    capabilities: {
      tools: {}
    }
  }
}

export function createSdkServer(config) {
  return new Server(config.serverInfo, {
    capabilities: config.capabilities
  })
}
