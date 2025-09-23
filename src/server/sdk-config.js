import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createServerConfig } from './config.js'
import { McpServer } from './mcp-server.js'

const STREAMABLE_MODULE_PATHS = [
  '@modelcontextprotocol/sdk/server/streamableHttp.js',
  '@modelcontextprotocol/sdk/server/streamable-http.js',
  '@modelcontextprotocol/sdk/dist/server/streamableHttp.js',
  '@modelcontextprotocol/sdk/dist/server/streamable-http.js'
]

let streamableTransportPromise

/**
 * Dynamically loads the StreamableHTTPServerTransport module.
 * @returns {Promise<object|null>} The StreamableHTTPServerTransport class or null if not found.
 */
export async function loadStreamableTransport() {
  if (streamableTransportPromise === undefined) {
    streamableTransportPromise = (async () => {
      for (const specifier of STREAMABLE_MODULE_PATHS) {
        try {
          const module = await import(specifier)
          if (module && module.StreamableHTTPServerTransport) {
            return module.StreamableHTTPServerTransport
          }
        } catch (error) {
          const message = typeof error === 'object' && error !== null ? String(error.message || error) : String(error)
          if (error?.code !== 'ERR_MODULE_NOT_FOUND' && !message.includes('Cannot find module')) {
            throw error
          }
        }
      }
      return null
    })()
  }
  return streamableTransportPromise
}

/**
 * Creates an SDK server configuration object.
 * @param {object} overrides Configuration overrides.
 * @returns {Promise<object>} The SDK server configuration.
 */
export async function createSdkServerConfig(overrides = {}) {
  const baseConfig = createServerConfig({ ...overrides, mode: 'remote' })
  const StreamableHTTPServerTransport = await loadStreamableTransport()
  
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

/**
 * Creates an MCP server instance.
 * @param {object} config The server configuration.
 * @returns {McpServer} The MCP server instance.
 */
export function createSdkServer(config) {
  return new McpServer(config.serverInfo, {
    capabilities: config.capabilities
  })
}
