/**
 * Logs a categorized error message to stderr.
 * @param category One of: invalid_url, no_captions, inaccessible, network_error, other_error.
 * @param message A human-readable message.
 */
export function logError(category, message) {
  console.error(`${category}: ${message}`)
}
