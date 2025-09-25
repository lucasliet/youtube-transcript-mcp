import { Readable } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'
import crypto from 'node:crypto'

const DEFAULT_TIMEOUT = 5000

export async function startRemoteServer(options = {}) {
  const module = await import('../../src/server/remote-server.js')
  if (!module || typeof module.startRemoteServer !== 'function') {
    throw new Error('remote server module not implemented')
  }
  return module.startRemoteServer({ host: '127.0.0.1', ...options })
}

export async function openEventStream(server, headers = {}) {
  const controller = new globalThis.AbortController()
  const response = await globalThis.fetch(`${server.baseUrl}/mcp/events`, {
    headers: { Accept: 'text/event-stream', ...headers },
    signal: controller.signal
  })
  const stream = Readable.fromWeb(response.body)
  const decoder = new globalThis.TextDecoder()
  let buffer = ''
  const events = []
  const waiters = []
  let ended = false
  let finish
  const finished = new Promise((resolve) => {
    finish = resolve
  })

  const drainBuffer = () => {
    const findBoundary = () => {
      const lf = buffer.indexOf('\n\n')
      const crlf = buffer.indexOf('\r\n\r\n')
      if (lf === -1 && crlf === -1) return { idx: -1, len: 0 }
      if (lf === -1) return { idx: crlf, len: 4 }
      if (crlf === -1) return { idx: lf, len: 2 }
      return crlf < lf ? { idx: crlf, len: 4 } : { idx: lf, len: 2 }
    }
    let { idx: boundary, len: sepLen } = findBoundary()
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + sepLen)
      if (raw.trim()) {
        const evt = parseEvent(raw)
        if (waiters.length) {
          waiters.shift().resolve(evt)
        } else {
          events.push(evt)
        }
      }
      ;({ idx: boundary, len: sepLen } = findBoundary())
    }
  }

  ;(async () => {
    try {
      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true })
        drainBuffer()
      }
      buffer += decoder.decode()
      drainBuffer()
    } catch (err) {
      if (err?.name !== 'AbortError') {
        waitersSliceReject(waiters, err)
      }
    } finally {
      buffer += decoder.decode()
      drainBuffer()
      ended = true
      waitersSliceReject(waiters, new Error('stream ended'))
      finish?.()
    }
  })().catch(() => {})

  async function nextEvent(timeoutMs = DEFAULT_TIMEOUT) {
    if (events.length) return events.shift()
    if (ended) throw new Error('stream ended')
    let timer
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: (value) => {
          if (timer) globalThis.clearTimeout(timer)
          resolve(value)
        },
        reject: (err) => {
          if (timer) globalThis.clearTimeout(timer)
          reject(err)
        }
      }
      waiters.push(waiter)
      timer = globalThis.setTimeout(() => {
        const index = waiters.indexOf(waiter)
        if (index !== -1) waiters.splice(index, 1)
        reject(new Error('event timeout'))
      }, timeoutMs)
      if (typeof timer.unref === 'function') timer.unref()
    })
  }

  async function expectEvent(name, timeoutMs = DEFAULT_TIMEOUT) {
    const evt = await nextEvent(timeoutMs)
    if (evt.event !== name) {
      throw new Error(`expected event ${name} but received ${evt.event}`)
    }
    return evt
  }

  function close() {
    controller.abort()
    return finished
  }

  return { response, nextEvent, expectEvent, close }
}

function waitersSliceReject(waiters, error) {
  while (waiters.length) {
    waiters.shift().reject(error)
  }
}

export async function postMessage(server, payload, headers = {}) {
  return globalThis.fetch(`${server.baseUrl}/mcp/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload)
  })
}

export function randomConnectionId() {
  return crypto.randomUUID()
}

export async function waitForEventType(stream, event, timeoutMs = DEFAULT_TIMEOUT) {
  while (true) {
    const next = await stream.nextEvent(timeoutMs)
    if (next.event === event) return next
  }
}

function parseEvent(raw) {
  const lines = raw.split(/\r?\n/)
  const event = { event: 'message', data: '', id: undefined }
  const dataLines = []
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event.event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    } else if (line.startsWith('id:')) {
      event.id = line.slice(3).trim()
    }
  }
  event.data = dataLines.join('\n')
  return event
}

export async function waitForCondition(check, timeoutMs = DEFAULT_TIMEOUT, intervalMs = 25) {
  const start = Date.now()
  while (true) {
    const result = await check()
    if (result) return result
    if (Date.now() - start > timeoutMs) throw new Error('condition timeout')
    await delay(intervalMs)
  }
}
