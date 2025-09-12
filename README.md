# YouTube Transcript MCP Tool

Ferramenta MCP para obter transcrições de vídeos do YouTube com timestamps e fornecer para agentes LLM. Equivalente funcional ao comportamento de `example.ts`.

## Uso via npx
```
npx youtube-transcript-mcp --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"
```
Retorna JSON no stdout com a lista de segmentos ou `null` em falha.

## Configuração MCP (exemplo)
No host MCP (ex: Claude Desktop / MCP compatível):
```
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "npx",
      "args": ["-y", "--package=github:lucasliet/youtube-transcript-mcp#main", "youtube-transcript-mcp"],
      "env": {}
    }
  }
}
```

## Integração MCP (programática)
```
import tools from 'youtube-transcript-mcp'
```
`tools` é um array com a ferramenta `transcript_yt` pronta para registro no host MCP.

## Desenvolvimento
- Node 18+
- TypeScript

Scripts:
```
npm run build
npm test
```

## Garantias de Projeto
- Sem cache interno
- Sem truncamento de resposta
- Erros retornam `null`; logs categorizados
- Seleção de idioma com prioridade e fallback
 - Servidor MCP usando @modelcontextprotocol/sdk; tools/list e tools/call com schemas do SDK
 - Retorno do tools/call no MCP é `content` type `text` com JSON serializado dos segmentos
