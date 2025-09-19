import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createServerConfig } from './config.js'
import { McpServer } from './mcp-server.js'

let StreamableHTTPServerTransport = null
try {
  const module = await import('@modelcontextprotocol/sdk/server/streamableHttp.js')
  if (module && module.StreamableHTTPServerTransport) {
    StreamableHTTPServerTransport = module.StreamableHTTPServerTransport
  }
} catch (error) {
  const message = typeof error === 'object' && error !== null ? String(error.message || error) : String(error)
  if (error?.code !== 'ERR_MODULE_NOT_FOUND' && !message.includes('Cannot find module')) {
    throw error
  }
}

export function createSdkServerConfig(overrides = {}) {
  const baseConfig = createServerConfig({ ...overrides, mode: 'remote' })
  
  return {
    ...baseConfig,
    transports: {
      streamable: StreamableHTTPServerTransport,
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
