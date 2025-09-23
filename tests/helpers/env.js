import http from 'node:http'

let loopbackProbe

async function probeLoopbackAvailability() {
  return new Promise((resolve) => {
    const server = http.createServer()

    const finalize = (result) => {
      if (server.listening) {
        server.close(() => resolve(result))
        return
      }
      resolve(result)
    }

    server.once('error', () => finalize(false))
    server.listen({ host: '127.0.0.1', port: 0 }, () => finalize(true))
  })
}

/**
 * Determines whether the current environment allows binding to the loopback interface.
 * @returns Promise resolving to true when binding succeeds, false otherwise.
 */
export async function canBindLoopback() {
  if (!loopbackProbe) {
    loopbackProbe = probeLoopbackAvailability()
  }
  return loopbackProbe
}

/**
 * Skips the provided test when the loopback interface cannot be bound in the current environment.
 * @param t node:test context instance used for skipping.
 * @returns Promise resolving to true when execution may continue, false when the test was skipped.
 */
export async function skipIfCannotBindLoopback() {
  const available = await canBindLoopback()
  if (available) return true
  return false
}
