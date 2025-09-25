const STREAMABLE_MODULE_PATHS = [
  '@modelcontextprotocol/sdk/server/streamableHttp.js',
  '@modelcontextprotocol/sdk/server/streamable-http.js',
  '@modelcontextprotocol/sdk/dist/server/streamableHttp.js',
  '@modelcontextprotocol/sdk/dist/server/streamable-http.js'
]

let cachedTransportPromise

/**
 * Loads the Streamable HTTP transport from the MCP SDK when available.
 * @returns {Promise<unknown>} The transport constructor or null when the SDK package does not expose it.
 */
export async function loadStreamableTransport() {
  if (!cachedTransportPromise) {
    cachedTransportPromise = (async () => {
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
  return cachedTransportPromise
}

/**
 * Resets the cached transport promise for testing purposes.
 * @returns {void}
 */
export function resetStreamableTransportCache() {
  cachedTransportPromise = undefined
}
