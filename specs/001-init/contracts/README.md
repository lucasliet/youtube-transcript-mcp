# Contracts

Não há endpoints HTTP externos. A interface é exposta via servidor MCP (stdio) usando @modelcontextprotocol/sdk.

Handlers registrados:
- tools/list → ListToolsRequestSchema
- tools/call → CallToolRequestSchema

Tool exposta: transcript_yt
- inputSchema: {
  type: 'object',
  properties: {
    videoUrl: { type: 'string' },
    preferredLanguages: { type: 'array', items: { type: 'string' } }
  },
  required: ['videoUrl'],
  additionalProperties: false
}
- retorno (MCP): { content: [{ type: 'text', text: JSON.stringify(segments) }] }
- sem cache; null em falhas; logs categorizados em stderr
