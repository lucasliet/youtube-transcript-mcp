import { createSdkServerConfig, createSdkServer } from './sdk-config.js'
import { SdkTransportRegistry } from './sdk-transport-registry.js'
import { registerTranscriptTool } from './register-transcript-tool.js'

/**
 * Starts the remote MCP server using the official SDK with consolidated /mcp endpoint.
 * Supports both SSE (GET) and JSON-RPC POST transports for IDE compatibility.
 * @param overrides Optional configuration overrides applied to the base config.
 * @returns Object containing the active configuration, base URL, and close handler.
 */
export async function startSdkRemoteServer(overrides = {}) {
  const config = createSdkServerConfig(overrides)
  const server = createSdkServer(config)
  registerTranscriptTool(server)

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

/**
 * Legacy helper retained for backwards compatibility with previous entry points.
 * @param overrides Optional configuration overrides.
 * @returns Result of startSdkRemoteServer with the same overrides.
 */
export async function startRemoteServer(overrides = {}) {
  console.warn('startRemoteServer is deprecated. Use startSdkRemoteServer instead.')
  return startSdkRemoteServer(overrides)
}
