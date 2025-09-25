import { logError } from '../lib/log.js'

/**
 * Forwards remote server log messages to the shared logging utility.
 * @param category Log category identifier.
 * @param message Textual message to record.
 */
export function logRemote(category, message) {
  logError(category, message)
}
