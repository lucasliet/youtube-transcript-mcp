const STREAMABLE_MODULE_PATHS = [
  '@modelcontextprotocol/sdk/server/streamableHttp.js'
]

export async function safeImportStreamableTransport() {
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
}
