import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

/**
 * MCP server wrapper that provides tool registration helpers on top of the SDK server.
 */
export class McpServer extends Server {
  /**
   * Creates a MCP server instance with built-in tool registration handlers.
   * @param serverInfo Server implementation metadata.
   * @param options Capability configuration to pass to the SDK server.
   */
  constructor(serverInfo, options) {
    super(serverInfo, options)
    this.tools = new Map()
    this.setRequestHandler(ListToolsRequestSchema, () => this.listTools())
    this.setRequestHandler(CallToolRequestSchema, (request) => this.callTool(request))
  }

  /**
   * Registers a tool definition and execution handler so clients can discover and invoke the tool.
   * @param tool Tool metadata advertised to clients.
   * @param handler Execution handler that receives tool arguments and returns a JSON-serializable result.
   * @returns Void.
   */
  registerTool(tool, handler) {
    this.tools.set(tool.name, { tool, handler })
  }

  /**
   * Returns the list of registered tools for tools/list requests.
   * @returns Object containing the tools array.
   */
  listTools() {
    return {
      tools: Array.from(this.tools.values()).map((registration) => registration.tool)
    }
  }

  /**
   * Executes a tool call using the registered handler.
   * @param request Parsed CallTool request from the SDK schema.
   * @returns MCP tool response containing serialized content or error information.
   */
  async callTool(request) {
    const name = request?.params?.name
    const registration = this.tools.get(name)
    if (!registration) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ code: 'tool_not_found', message: 'Tool not found' }) }],
        isError: true
      }
    }
    try {
      const args = request?.params?.arguments || {}
      const result = await registration.handler(args)
      return {
        content: [{ type: 'text', text: JSON.stringify(result ?? {}) }]
      }
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? error.message : String(error)
      return {
        content: [{ type: 'text', text: JSON.stringify({ code: 'internal_error', message }) }],
        isError: true
      }
    }
  }
}
