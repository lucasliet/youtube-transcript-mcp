const STREAMABLE_MODULE_PATHS = [
  '@modelcontextprotocol/sdk/server/streamableHttp.js'
]

let cachedTransport

export async function safeImportStreamableTransport() {
  if (cachedTransport !== undefined) {
    return cachedTransport
  }

  for (const specifier of STREAMABLE_MODULE_PATHS) {
    try {
      const module = await import(specifier)
      if (module && module.StreamableHTTPServerTransport) {
        cachedTransport = module.StreamableHTTPServerTransport
        return cachedTransport
      }
    } catch (error) {
      const code = error?.code
      const message = typeof error?.message === 'string' ? error.message : String(error)
      const isModuleNotFound = code === 'ERR_MODULE_NOT_FOUND' || message.includes('Cannot find module')
      const specFile = specifier.slice(specifier.lastIndexOf('/') + 1)
      const mentionsSameSpecifier =
        message.includes(`'${specifier}'`) ||
        message.includes(`"${specifier}"`) ||
        message.includes(specifier) ||
        message.includes(specFile) ||
        (typeof error?.url === 'string' && (error.url.includes(specifier) || error.url.includes(specFile)))
      if (!(isModuleNotFound && mentionsSameSpecifier)) {
        throw error
      }
    }
  }

  cachedTransport = null
  return cachedTransport
}
