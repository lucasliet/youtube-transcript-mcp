# YouTube Transcript MCP Tool

Ferramenta MCP para obter transcrições de vídeos do YouTube com timestamps e fornecer para agentes LLM.

## Instalação / Uso via npx
Via GitHub:
```
npx -y --package=github:lucasliet/youtube-transcript-mcp#main youtube-transcript-mcp --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"
```
Saída do CLI: JSON no stdout (array de segmentos) ou `null` em falha.

## Registro da Ferramenta no MCP Host
Exemplo de configuração (pseudo JSON):
```
{
  "tools": [
    {
      "name": "transcript_yt",
      "args": {
        "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
        "preferredLanguages": ["pt-BR", "en"]
      }
    }
  ]
}
```

Uso programático (import do pacote):
```
import tools from 'youtube-transcript-mcp'
```
`tools` é um array contendo a ferramenta `transcript_yt` pronta para registro no host MCP.

## Configuração como MCP Server
Coloque no arquivo de configuração do host MCP:
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
Este servidor utiliza `@modelcontextprotocol/sdk` e comunica via stdio.

Formato de retorno (MCP):
- O handler `tools/call` retorna `content` com `type: "text"` contendo o JSON serializado do array de segmentos.

## Chamada
Entrada:
```
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "preferredLanguages": ["pt-BR", "en"]
}
```
Saída (exemplo abreviado)
CLI:
```
[
  { "text": "Intro...", "startInMs": 0, "duration": 2300 },
  { "text": "Next segment...", "startInMs": 2300, "duration": 1800 }
]
```
MCP (content type text):
```
{
  "content": [
    { "type": "text", "text": "[{\"text\":\"Intro...\",\"startInMs\":0,\"duration\":2300}]" }
  ]
}
```

## Regras de Seleção de Legenda
Prioridade: manual idioma preferido > automática idioma preferido > track padrão > primeira disponível.
Matching de idioma: case-insensitive + prefixo ("pt" casa "pt-BR").

## Comportamento de Erro
Retorna `null` em qualquer falha. Logs internos categorizam causa.

## Limitações
- Sem cache interno
- Sem truncamento de resposta
- Sem persistência em disco

## Desenvolvimento
- Node 18+
- JavaScript ESM

Scripts:
```
npm test
npm run lint
```

## Testes Esperados
- URL inválida → `null`
- Sem legendas → `null`
- Fallback automático de idioma funciona
- Parsing de dois formatos XML suportados
