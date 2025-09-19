import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SDK_ERROR_CATEGORIES } from '../../src/lib/log.js'

describe('SDK Error Codes Contract', () => {
  it('should define required error categories', () => {
    assert(SDK_ERROR_CATEGORIES.MCP_PROTOCOL, 'Should define MCP_PROTOCOL')
    assert(SDK_ERROR_CATEGORIES.MCP_INITIALIZE, 'Should define MCP_INITIALIZE')
    assert(SDK_ERROR_CATEGORIES.SSE_TRANSPORT, 'Should define SSE_TRANSPORT')
    assert(SDK_ERROR_CATEGORIES.SDK_ERROR, 'Should define SDK_ERROR')
    
    console.log('Error categories defined correctly')
  })

  it('should validate error category values', () => {
    assert.equal(SDK_ERROR_CATEGORIES.MCP_PROTOCOL, 'mcp_protocol')
    assert.equal(SDK_ERROR_CATEGORIES.SSE_TRANSPORT, 'sse_transport')
    
    console.log('Error category values validated')
  })
})
