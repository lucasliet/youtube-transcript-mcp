const VALID_CODES = new Set([
  'invalid_request',
  'unauthorised', 'unauthorized',
  'not_found',
  'timeout',
  'tool_error',
  'server_error',
  'network_error',
  'server_busy'
])

export function createErrorFrame(code, message, details = null) {
  const normalized = VALID_CODES.has(code) ? code : 'server_error'
  return { code: normalized, message, details }
}
