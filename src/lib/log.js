/**
 * Enhanced logging system for MCP SDK with categorized error handling.
 * Supports SDK-specific error categories and structured logging.
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
}

const SDK_ERROR_CATEGORIES = {
  MCP_PROTOCOL: 'mcp_protocol',
  MCP_INITIALIZE: 'mcp_initialize',
  MCP_SHUTDOWN: 'mcp_shutdown',
  SSE_TRANSPORT: 'sse_transport',
  STREAMABLE_TRANSPORT: 'streamable_transport',
  SSE_CONNECTION: 'sse_connection',
  SSE_MESSAGE: 'sse_message',
  SESSION_INVALID: 'session_invalid',
  SESSION_EXPIRED: 'session_expired',
  SESSION_MISSING: 'session_missing',
  LEGACY_ENDPOINT: 'legacy_endpoint',
  LEGACY_COMPATIBILITY: 'legacy_compatibility',
  SDK_ERROR: 'sdk_error',
  SDK_CONFIG: 'sdk_config',
  SDK_TIMEOUT: 'sdk_timeout',
  HTTP_REQUEST: 'http_request',
  SERVER_LIFECYCLE: 'server_lifecycle'
}

/**
 * Logs a categorized error message with SDK context.
 * @param category SDK error category
 * @param message Human-readable message
 * @param level Log level (defaults to ERROR)
 * @param context Additional context object
 */
export function logSdkError(category, message, level = LOG_LEVELS.ERROR, context = {}) {
  const timestamp = new Date().toISOString()
  let logMessage = `[${timestamp}] ${level} [${category}] ${message}`
  if (context.sessionId) {
    logMessage += ` (session: ${context.sessionId})`
  }

  console.error(logMessage)

  if (process.env.NODE_ENV === 'development' && Object.keys(context).length > 0) {
    const payload = {
      timestamp,
      level,
      category,
      message,
      ...context
    }
    console.error('Context:', JSON.stringify(payload, null, 2))
  }
}

/**
 * Logs SDK transport events.
 * @param event Event type
 * @param details Event details
 */
export function logSdkTransport(event, details = {}) {
  const categoryMap = {
    sse: SDK_ERROR_CATEGORIES.SSE_TRANSPORT,
    streamable: SDK_ERROR_CATEGORIES.STREAMABLE_TRANSPORT
  }
  const category = categoryMap[details.type] || SDK_ERROR_CATEGORIES.SDK_ERROR
  logSdkError(category, `Transport event: ${event}`, LOG_LEVELS.INFO, details)
}

/**
 * Logs MCP protocol events.
 * @param event Protocol event
 * @param details Event details
 */
export function logMcpProtocol(event, details = {}) {
  const categoryMap = {
    initialize: SDK_ERROR_CATEGORIES.MCP_INITIALIZE,
    shutdown: SDK_ERROR_CATEGORIES.MCP_SHUTDOWN,
    request: SDK_ERROR_CATEGORIES.MCP_PROTOCOL,
    response: SDK_ERROR_CATEGORIES.MCP_PROTOCOL
  }
  const category = categoryMap[event] || SDK_ERROR_CATEGORIES.MCP_PROTOCOL
  logSdkError(category, `MCP protocol event: ${event}`, LOG_LEVELS.INFO, details)
}

/**
 * Logs one safe HTTP access line without query strings or user payloads.
 * @param {object} details HTTP request details.
 * @param {string} details.method HTTP method.
 * @param {string} details.url Request URL path and query.
 * @param {number} details.statusCode Response status code.
 * @param {number} details.durationMs Request duration in milliseconds.
 */
export function logHttpRequest({ method, url, statusCode, durationMs }) {
  const route = sanitizeRoute(url)
  const roundedDuration = Math.max(0, Math.round(Number(durationMs) || 0))
  logSdkError(
    SDK_ERROR_CATEGORIES.HTTP_REQUEST,
    `${method || 'UNKNOWN'} ${route} ${statusCode || 0} ${roundedDuration}ms`,
    LOG_LEVELS.INFO
  )
}

/**
 * Removes query strings from request URLs before logging.
 * @param {string} url Request URL path and optional query.
 * @returns {string} Safe route string suitable for logs.
 */
function sanitizeRoute(url) {
  if (!url || typeof url !== 'string') return '/unknown'
  const [pathname] = url.split('?')
  return pathname || '/unknown'
}

/**
 * Legacy function for backwards compatibility.
 * @param category Error category
 * @param message Error message
 */
export function logError(category, message) {
  const legacyKey = String(category || '').toLowerCase()
  const legacyToSdk = {
    invalid_url: SDK_ERROR_CATEGORIES.MCP_PROTOCOL,
    invalid_request: SDK_ERROR_CATEGORIES.MCP_PROTOCOL,
    inaccessible: SDK_ERROR_CATEGORIES.LEGACY_COMPATIBILITY,
    no_captions: SDK_ERROR_CATEGORIES.SDK_ERROR,
    network_error: SDK_ERROR_CATEGORIES.SSE_CONNECTION,
    tool_error: SDK_ERROR_CATEGORIES.SDK_ERROR,
    other_error: SDK_ERROR_CATEGORIES.SDK_ERROR,
    timeout: SDK_ERROR_CATEGORIES.SDK_TIMEOUT,
    legacy_endpoint: SDK_ERROR_CATEGORIES.LEGACY_ENDPOINT,
    legacy_compatibility: SDK_ERROR_CATEGORIES.LEGACY_COMPATIBILITY,
    session_invalid: SDK_ERROR_CATEGORIES.SESSION_INVALID,
    session_expired: SDK_ERROR_CATEGORIES.SESSION_EXPIRED,
    session_missing: SDK_ERROR_CATEGORIES.SESSION_MISSING
  }

  const sdkCategory = legacyToSdk[legacyKey] || SDK_ERROR_CATEGORIES.SDK_ERROR
  logSdkError(sdkCategory, message)
}

export { LOG_LEVELS, SDK_ERROR_CATEGORIES }
