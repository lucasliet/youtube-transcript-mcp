import { createSdkServerConfig, createSdkServer } from './sdk-config.js'
import { SdkTransportRegistry } from './sdk-transport-registry.js'
import { transcriptYt } from '../tool/transcriptYt.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

/**
 * Starts the remote MCP server using the official SDK with consolidated /mcp endpoint.
 * Supports both SSE (GET) and StreamableHTTP (POST) transports for IDE compatibility.
 */
export async function startSdkRemoteServer(overrides = {}) {
  const config = createSdkServerConfig(overrides)
  const server = createSdkServer(config)
  
  // Register tools with SDK server
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
  }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
      const name = req?.params?.name
      const args = req?.params?.arguments || {}
      
      if (name !== 'transcript_yt') {
        return {
          content: [{ type: 'text', text: JSON.stringify({ code: 'tool_not_found', message: 'Tool not found' }) }],
          isError: true
        }
      }
      
      const res = await transcriptYt({
        videoUrl: String(args.videoUrl || ''),
        preferredLanguages: Array.isArray(args.preferredLanguages) ? args.preferredLanguages : undefined
      })
      
      return { content: [{ type: 'text', text: JSON.stringify(res) }] }
    } catch (e) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ code: 'internal_error', message: e?.message || String(e) }) }],
        isError: true
      }
    }
  })

  // Initialize transport registry with consolidated /mcp endpoint
  const registry = new SdkTransportRegistry(config, server)
  const serverInfo = await registry.start()
  
  async function close() {
    await registry.close()
  }

  return { 
    config, 
    baseUrl: serverInfo.baseUrl,
    close 
  }
}

// Legacy function for backwards compatibility - will be removed
export async function startRemoteServer(overrides = {}) {
  console.warn('startRemoteServer is deprecated. Use startSdkRemoteServer instead.')
  return startSdkRemoteServer(overrides)
}
