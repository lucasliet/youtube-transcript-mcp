export class RequestState {
  constructor(id, method, timeoutMs) {
    this.id = id
    this.method = method
    this.startedAt = Date.now()
    this.timeoutMs = timeoutMs
    this.abortController = new AbortController()
    this.completed = false
  }

  get signal() {
    return this.abortController.signal
  }

  markCompleted() {
    this.completed = true
  }

  cancel(reason) {
    if (this.completed) return
    this.abortController.abort(reason)
  }
}
