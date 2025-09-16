import { logError } from '../lib/log.js'

export function logRemote(category, message) {
  logError(category, message)
}
