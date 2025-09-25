import test from 'node:test'
import assert from 'node:assert/strict'
import * as logModule from '../../src/lib/log.js'

test('logSdkError emits structured context in development', () => {
  const originalEnv = process.env.NODE_ENV
  const originalError = console.error
  const messages = []
  console.error = (...args) => {
    messages.push(args.join(' '))
  }
  process.env.NODE_ENV = 'development'
  try {
    logModule.logSdkError(logModule.SDK_ERROR_CATEGORIES.SDK_ERROR, 'failure', logModule.LOG_LEVELS.ERROR, {
      sessionId: 'abc',
      reason: 'timeout'
    })
    assert.equal(messages.length, 2)
    assert.ok(messages[0].includes('[sdk_error] failure'))
    assert.ok(messages[0].includes('(session: abc)'))
    assert.ok(messages[1].includes('"reason":'))
  } finally {
    console.error = originalError
    if (originalEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalEnv
  }
})

test('logSdkTransport emits transport category logs', () => {
  const originalError = console.error
  const messages = []
  console.error = (...args) => messages.push(args.join(' '))
  try {
    logModule.logSdkTransport('connected', { type: 'sse', sessionId: 'session-1' })
    assert.equal(messages.length, 1)
    assert.ok(messages[0].includes('[sse_transport] Transport event: connected'))
    assert.ok(messages[0].includes('(session: session-1)'))
  } finally {
    console.error = originalError
  }
})

test('logMcpProtocol uses fallback category for unknown events', () => {
  const originalError = console.error
  const messages = []
  console.error = (...args) => messages.push(args.join(' '))
  try {
    logModule.logMcpProtocol('unknown', { detail: 'x' })
    assert.equal(messages.length, 1)
    assert.ok(messages[0].includes('[mcp_protocol] MCP protocol event: unknown'))
  } finally {
    console.error = originalError
  }
})

test('logError maps legacy categories to SDK categories', () => {
  const originalError = console.error
  const messages = []
  console.error = (...args) => messages.push(args.join(' '))
  try {
    logModule.logError('legacy_endpoint', 'deprecated')
    logModule.logError('unknown_code', 'fallback')
    assert.equal(messages.length, 2)
    assert.ok(messages[0].includes('[legacy_endpoint] deprecated'))
    assert.ok(messages[1].includes('[sdk_error] fallback'))
  } finally {
    console.error = originalError
  }
})
