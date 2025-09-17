/**
 * Enhanced error handling system for MCP SDK with categorized error responses.
 * Provides standardized error responses compatible with MCP protocol.
 */

import { logSdkError, SDK_ERROR_CATEGORIES } from './log.js'

const VALID_ERROR_CODES = new Set([
  'invalid_request',
  'unauthorised',
  'unauthorized',
  'not_found',
  'timeout',
  'tool_error',
  'server_error',
  'network_error',
  'server_busy',
  // SDK-specific error codes
  'mcp_protocol',
  'mcp_initialize',
  'mcp_shutdown',
  'session_invalid',
  'session_expired',
  'session_missing'
])

/**
 * Creates a standardized MCP error response with logging.
 * @param code Error code
 * @param message Human-readable error message
 * @param details Additional error details
 * @param context Additional logging context
 * @returns MCP-compliant error response
 */
export function createMcpErrorResponse(code, message, details = null, context = {}) {
  const normalizedCode = VALID_ERROR_CODES.has(code) ? code : 'server_error'
  
  // Map error codes to SDK logging categories
  const categoryMap = {
    'invalid_request': SDK_ERROR_CATEGORIES.MCP_PROTOCOL,
    'mcp_initialize': SDK_ERROR_CATEGORIES.MCP_INITIALIZE,
    'mcp_shutdown': SDK_ERROR_CATEGORIES.MCP_SHUTDOWN,
    'session_invalid': SDK_ERROR_CATEGORIES.SESSION_INVALID,
    'session_expired': SDK_ERROR_CATEGORIES.SESSION_EXPIRED,
    'session_missing': SDK_ERROR_CATEGORIES.SESSION_MISSING,
    'tool_error': SDK_ERROR_CATEGORIES.SDK_ERROR,
    'server_error': SDK_ERROR_CATEGORIES.SDK_ERROR,
    'network_error': SDK_ERROR_CATEGORIES.SDK_ERROR,
    'timeout': SDK_ERROR_CATEGORIES.SDK_TIMEOUT
  }
  
  const logCategory = categoryMap[normalizedCode] || SDK_ERROR_CATEGORIES.SDK_ERROR
  
  // Log the error with SDK logging system
  logSdkError(logCategory, message, undefined, {
    errorCode: normalizedCode,
    ...context
  })
  
  return {
    code: normalizedCode,
    message,
    details
  }
}

/**
 * Creates an MCP JSON-RPC error response.
 * @param id Request ID
 * @param code Error code
 * @param message Error message
 * @param data Additional error data
 * @returns MCP JSON-RPC error response
 */
export function createJsonRpcError(id, code, message, data = null) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: typeof code === 'number' ? code : -32000,
      message,
      data
    }
  }
}

/**
 * Handles MCP protocol errors with proper logging and response formatting.
 * @param error Original error
 * @param context Error context
 * @returns Formatted MCP error response
 */
export function handleMcpProtocolError(error, context = {}) {
  const errorCode = error.code || 'server_error'
  const errorMessage = error.message || 'An unexpected error occurred'
  
  return createMcpErrorResponse(errorCode, errorMessage, {
    originalError: error.name,
    stack: error.stack
  }, context)
}

// Legacy function for backwards compatibility
export function createErrorFrame(code, message, details = null) {
  return createMcpErrorResponse(code, message, details)
}

export { VALID_ERROR_CODES }
