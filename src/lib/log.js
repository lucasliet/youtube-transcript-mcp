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
  // MCP Protocol errors
  MCP_PROTOCOL: 'mcp_protocol',
  MCP_INITIALIZE: 'mcp_initialize',
  MCP_SHUTDOWN: 'mcp_shutdown',
  
  // Transport errors
  SSE_TRANSPORT: 'sse_transport',
  SSE_CONNECTION: 'sse_connection',
  SSE_MESSAGE: 'sse_message',
  
  // Session errors
  SESSION_INVALID: 'session_invalid',
  SESSION_EXPIRED: 'session_expired',
  SESSION_MISSING: 'session_missing',
  
  // Legacy compatibility
  LEGACY_ENDPOINT: 'legacy_endpoint',
  LEGACY_COMPATIBILITY: 'legacy_compatibility',
  
  // General SDK errors
  SDK_ERROR: 'sdk_error',
  SDK_CONFIG: 'sdk_config',
  SDK_TIMEOUT: 'sdk_timeout'
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
    logMessage += ' (session: ' + context.sessionId + ')'
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
  const category = details.type === 'sse' ? SDK_ERROR_CATEGORIES.SSE_TRANSPORT : SDK_ERROR_CATEGORIES.SDK_ERROR
  logSdkError(category, 'Transport event: ' + event, LOG_LEVELS.INFO, details)
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
  logSdkError(category, 'MCP protocol event: ' + event, LOG_LEVELS.INFO, details)
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

// Export constants for external use
export { LOG_LEVELS, SDK_ERROR_CATEGORIES }
