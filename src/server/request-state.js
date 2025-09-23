/**
 * Represents the state of an active request within a client session.
 */
export class RequestState {
  /**
   * @param {string|null} id The request ID.
   * @param {string} method The request method.
   * @param {number} timeoutMs The request timeout in milliseconds.
   */
  constructor(id, method, timeoutMs) {
    this.id = id
    this.method = method
    this.startedAt = Date.now()
    this.timeoutMs = timeoutMs
    this.abortController = new AbortController()
    this.completed = false
  }

  /**
   * Returns the AbortSignal for this request.
   * @returns {AbortSignal} The abort signal.
   */
  get signal() {
    return this.abortController.signal
  }

  /**
   * Marks the request as completed.
   */
  markCompleted() {
    this.completed = true
  }

  /**
   * Cancels the request.
   * @param {string} [reason] The reason for cancellation.
   */
  cancel(reason) {
    if (this.completed) return
    this.abortController.abort(reason)
  }
}