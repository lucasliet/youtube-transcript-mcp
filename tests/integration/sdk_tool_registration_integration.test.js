import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSdkServerConfig, createSdkServer } from '../../src/server/sdk-config.js'

describe('SDK Tool Registration Integration', () => {
  it('should register tools using registerTool and handle list/call requests', async () => {
    const config = createSdkServerConfig({ port: 0 })
    const server = createSdkServer(config)

    assert.equal(typeof server.registerTool, 'function', 'registerTool should be available')

    const calls = []
    server.registerTool({
      name: 'demo_tool',
      description: 'Demo tool for registration testing.',
      inputSchema: {
        type: 'object',
        properties: {
          foo: { type: 'string' }
        },
        required: [],
        additionalProperties: true
      }
    }, async (args) => {
      calls.push(args)
      return { ok: true, args }
    })

    const list = server.listTools()
    assert.equal(Array.isArray(list.tools), true, 'listTools should return array')
    assert.equal(list.tools.length, 1, 'Should contain registered tool')
    assert.equal(list.tools[0].name, 'demo_tool', 'Tool name should match registration')

    const listHandler = server._requestHandlers.get('tools/list')
    const callHandler = server._requestHandlers.get('tools/call')
    assert.equal(typeof listHandler, 'function', 'tools/list handler should be registered')
    assert.equal(typeof callHandler, 'function', 'tools/call handler should be registered')

    const listResult = await listHandler({ jsonrpc: '2.0', id: 'list-1', method: 'tools/list', params: {} })
    assert.equal(listResult.tools[0].name, 'demo_tool', 'tools/list handler should return registered tool')

    const callResult = await callHandler({ jsonrpc: '2.0', id: 'call-1', method: 'tools/call', params: { name: 'demo_tool', arguments: { foo: 'bar' } } })
    assert.equal(Array.isArray(callResult.content), true, 'tools/call response should contain content array')
    assert.equal(JSON.parse(callResult.content[0].text).ok, true, 'tools/call handler should return serialized result')
    assert.deepEqual(calls[0], { foo: 'bar' }, 'Handler should receive original arguments')

    const missingToolResult = await callHandler({ jsonrpc: '2.0', id: 'call-2', method: 'tools/call', params: { name: 'unknown_tool', arguments: {} } })
    assert.equal(missingToolResult.isError, true, 'Missing tool should produce error response')
  })
})
