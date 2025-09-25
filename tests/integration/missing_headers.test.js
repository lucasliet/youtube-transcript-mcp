import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SdkTransportRegistry } from '../../src/server/sdk-transport-registry.js'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('Missing Headers Error Scenario', () => {
  let registry

  it('should initialize registry for header testing', () => {
    const config = createSdkServerConfig({ port: 3333 })
    const server = createSdkServer(config)
    registry = new SdkTransportRegistry(config, server)

    assert(registry, 'Registry should be created')
  })

  it('should handle missing session ID headers gracefully', () => {
    const reqWithoutHeaders = {
      headers: {},
      url: '/mcp'
    }

    const sessionId = registry.extractSessionId(reqWithoutHeaders)
    assert.equal(sessionId, undefined, 'Should return undefined for missing session ID')
  })

  it('should handle missing headers object gracefully', () => {
    const reqWithoutHeaders = {
      url: '/mcp'
    }

    const sessionId = registry.extractSessionId(reqWithoutHeaders)
    assert.equal(sessionId, undefined, 'Should handle missing headers object')
  })

  it('should handle empty headers gracefully', () => {
    const reqWithEmptyHeaders = {
      headers: { 'content-type': 'application/json' },
      url: '/mcp?other=param'
    }

    const sessionId = registry.extractSessionId(reqWithEmptyHeaders)
    assert.equal(sessionId, undefined, 'Should return undefined when session ID header is missing')
  })

  it('should prioritize x-session-id header over query parameter', () => {
    const reqWithBoth = {
      headers: { 'x-session-id': 'header-session' },
      url: '/mcp?sessionId=query-session'
    }

    const sessionId = registry.extractSessionId(reqWithBoth)
    assert.equal(sessionId, 'header-session', 'Should prioritize header over query parameter')
  })

  it('should handle malformed query parameters gracefully', () => {
    const reqWithMalformedQuery = {
      headers: {},
      url: '/mcp?sessionId='
    }

    const sessionId = registry.extractSessionId(reqWithMalformedQuery)
    assert.equal(sessionId, undefined, 'Should handle empty sessionId in query')
  })

  it('should reject unsupported MCP protocol versions', () => {
    const req = {
      headers: { 'mcp-protocol-version': '2024-01-01' }
    }
    const res = createResponseStub()
    const result = registry.validateProtocolVersion(req, res)

    assert.equal(result, false, 'Unsupported protocol should fail validation')
    assert.equal(res.statusCode, 400, 'Unsupported protocol should return 400')
    const payload = JSON.parse(res.body)
    assert.equal(payload.error.code, 'invalid_protocol_version', 'Should respond with invalid_protocol_version error')
    assert.equal(payload.error.supported, '2025-06-18', 'Should include supported protocol version')
  })

  it('should accept supported MCP protocol versions', () => {
    const req = {
      headers: { 'mcp-protocol-version': '2025-06-18' }
    }
    const res = createResponseStub()
    const result = registry.validateProtocolVersion(req, res)

    assert.equal(result, true, 'Supported protocol should allow request to proceed')
    assert.equal(res.statusCode, undefined, 'Supported protocol should not modify response')
  })
})

/**
 * Creates a stub HTTP response object for local validation without network I/O.
 * @returns Response stub recording status code, headers, and body content.
 */
function createResponseStub() {
  return {
    statusCode: undefined,
    headers: undefined,
    body: undefined,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode
      this.headers = headers
    },
    end(payload) {
      this.body = payload
    }
  }
}
