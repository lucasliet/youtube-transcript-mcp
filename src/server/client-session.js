import crypto from 'node:crypto'
import { buildOutboundEvent } from './outbound-event.js'
import { createErrorFrame } from './error-frame.js'
import { RequestState } from './request-state.js'

export class ClientSession {
  constructor(response, config, logFn) {
    this.connectionId = crypto.randomUUID()
    this.response = response
    this.config = config
    this.log = logFn
    this.eventId = 0
    this.closed = false
    this.activeRequest = null
    this.heartbeatTimer = null
  }

  start() {
    this.response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...(this.config.cors ? { 'Access-Control-Allow-Origin': this.config.cors === true ? '*' : this.config.cors } : {})
    })
    this.send('ready', { connectionId: this.connectionId, messageEndpoint: '/mcp/messages' })
    this.startHeartbeat()
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(() => {
      if (this.closed) return
      this.send('heartbeat', { connectionId: this.connectionId, timestamp: Date.now() })
    }, this.config.heartbeatIntervalMs)
    if (typeof this.heartbeatTimer.unref === 'function') this.heartbeatTimer.unref()
  }

  registerRequest(requestId, method) {
    if (this.activeRequest) {
      return null
    }
    const state = new RequestState(requestId, method, this.config.requestTimeoutMs)
    this.activeRequest = state
    return state
  }

  completeRequest() {
    if (!this.activeRequest) return
    this.activeRequest.markCompleted()
    this.activeRequest = null
  }

  send(event, payload, requestId) {
    const outbound = buildOutboundEvent(event, this.connectionId, payload, requestId)
    this.write(outbound)
  }

  sendError(code, message, details, requestId) {
    this.send('error', createErrorFrame(code, message, details), requestId)
  }

  write(outbound) {
    if (this.closed) return
    const id = String(++this.eventId)
    let chunk = `id: ${id}\n`
    chunk += `event: ${outbound.event}\n`
    const lines = String(outbound.data || '').split(/\n/)
    for (const line of lines) {
      chunk += `data: ${line}\n`
    }
    chunk += '\n'
    this.response.write(chunk)
  }

  close() {
    if (this.closed) return
    this.closed = true
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.activeRequest) this.activeRequest.cancel()
    this.response.end()
  }
}
