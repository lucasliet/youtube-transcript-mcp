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

  it('should not reject any MCP protocol version header (parity with deno-deploy)', async () => {
    const req = {
      headers: { 'mcp-protocol-version': '2025-11-25' },
      url: '/mcp'
    }
    const res = createResponseStub()
    await registry.handleStreamableGet('nonexistent-session', req, res)

    assert.equal(res.statusCode, 404, 'Version header must be ignored; request reaches session lookup')
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
