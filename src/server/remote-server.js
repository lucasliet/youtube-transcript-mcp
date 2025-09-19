import { createSdkServerConfig, createSdkServer } from './sdk-config.js'
import { SdkTransportRegistry } from './sdk-transport-registry.js'
import { registerTranscriptTool } from './register-transcript-tool.js'

/**
 * Starts the remote MCP server using the official SDK with consolidated /mcp endpoint.
 * Supports both SSE (GET) and JSON-RPC POST transports for IDE compatibility.
 */
export async function startSdkRemoteServer(overrides = {}) {
  const config = createSdkServerConfig(overrides)
  const server = createSdkServer(config)
  
  registerTranscriptTool(server)

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
