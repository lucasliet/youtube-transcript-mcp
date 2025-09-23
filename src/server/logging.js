import { logError } from '../lib/log.js'

/**
 * Logs a remote server event.
 * @param {string} category The category of the log message.
 * @param {string} message The log message.
 */
export function logRemote(category, message) {
  logError(category, message)
}