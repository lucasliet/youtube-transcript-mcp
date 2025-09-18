import { after, before, describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { registerTranscriptTool } from '../../src/server/register-transcript-tool.js'

describe('Quickstart Validation Scenarios', () => {
  let registry
  let baseUrl

  before(async () => {
    const config = createSdkServerConfig({ port: 0, host: '127.0.0.1' })
    const server = createSdkServer(config)
    registerTranscriptTool(server)
    registry = new SdkTransportRegistry(config, server)
    const info = await registry.start()
    baseUrl = info.baseUrl
  })

  after(async () => {
    await registry.close()
  })

  it('should expose SSE endpoint and session identifier', async () => {
    const connection = await openSseConnection(baseUrl)
    assert.equal(typeof connection.sessionId, 'string', 'Session identifier should be available')
    assert.equal(connection.sessionId.length > 0, true, 'Session identifier should not be empty')
    await connection.close()
  })

  it('should accept initialize and tools/list requests over SSE transport', async () => {
    const connection = await openSseConnection(baseUrl)

    const initializeResponse = await postSseMessage(baseUrl, connection.sessionId, {
      jsonrpc: '2.0',
      id: 'init-1',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'quickstart', version: '1.0.0' }
      }
    })
    assert.equal(initializeResponse.status, 202, 'Initialize request should be accepted')

    const listResponse = await postSseMessage(baseUrl, connection.sessionId, {
      jsonrpc: '2.0',
      id: 'list-1',
      method: 'tools/list',
      params: {}
    })
    assert.equal(listResponse.status, 202, 'tools/list request should be accepted')

    await connection.close()
  })

  it('should reject tool access without session identifier', async () => {
    const response = await fetch(baseUrl + '/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'tool-1', method: 'tools/list', params: {} })
    })
    assert.equal(response.status, 400, 'Missing session should return bad request')
    const payload = await response.json()
    assert.equal(payload.error, 'Missing session ID', 'Response should explain missing session identifier')
  })
})

/**
 * Opens an SSE connection to the consolidated /mcp endpoint and extracts the generated session identifier.
 * @param baseUrl Base URL returned by the transport registry start method.
 * @returns Object containing the session identifier and a cleanup function.
 */
async function openSseConnection(baseUrl) {
  const controller = new AbortController()
  const response = await fetch(baseUrl + '/mcp', {
    headers: {
      Accept: 'text/event-stream',
      'MCP-Protocol-Version': '2024-11-05'
    },
    signal: controller.signal
  })
  assert.equal(response.status, 200, 'SSE endpoint should respond with 200')
  const reader = response.body?.getReader()
  assert(reader, 'SSE response should provide a readable stream')
  const decoder = new TextDecoder()
  let sessionId
  let buffer = ''
  while (!sessionId) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const match = buffer.match(/sessionId=([^\n]+)/)
    if (match) {
      sessionId = match[1].trim()
    }
  }
  assert(sessionId, 'SSE endpoint should report session identifier')
  return {
    sessionId,
    close: async () => {
      await reader.cancel()
      controller.abort()
    }
  }
}

/**
 * Posts an MCP JSON-RPC message to the consolidated /mcp endpoint using the SSE session identifier.
 * @param baseUrl Base URL returned by the transport registry start method.
 * @param sessionId Active SSE session identifier.
 * @param body JSON-RPC payload to send to the server.
 * @returns HTTP response from the POST request.
 */
async function postSseMessage(baseUrl, sessionId, body) {
  return fetch(baseUrl + '/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
      'MCP-Protocol-Version': '2024-11-05'
    },
    body: JSON.stringify(body)
  })
}
