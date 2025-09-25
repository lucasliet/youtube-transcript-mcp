import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createServerConfig } from './config.js'
import { McpServer } from './mcp-server.js'
import { loadStreamableTransport } from './loadStreamableTransport.js'

const StreamableHTTPServerTransport = await loadStreamableTransport()

/**
 * Builds the MCP server configuration with remote transport defaults.
 * @param {object} overrides Optional configuration overrides applied to the base config.
 * @returns {object} Fully resolved MCP server configuration.
 */
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
      version: '2.0.3'
    },
    capabilities: {
      tools: {}
    }
  }
}

/**
 * Creates an MCP server instance with the provided configuration.
 * @param {object} config The server configuration produced by createSdkServerConfig.
 * @returns {McpServer} Configured MCP server instance ready for transport wiring.
 */
export function createSdkServer(config) {
  return new McpServer(config.serverInfo, {
    capabilities: config.capabilities
  })
}
