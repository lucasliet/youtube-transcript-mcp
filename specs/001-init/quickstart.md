# Quickstart: YouTube Transcript MCP Tool

## Instalação / Uso via npx
Publicação opcional no npm (quando existir):
```
npx youtube-transcript-mcp --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"
```
Via GitHub (sem publicar no npm):
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

// tools é um array contendo ['transcript_yt', { schema, fn }]
```

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
Saída (exemplo abreviado):
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
Retorna null em qualquer falha. Logs internos categorizam causa.

## Limitações
- Sem cache interno
- Não trunca transcrição
- Sem persistência em disco

## Testes Esperados
- URL inválida → null
- Sem legendas → null
- Fallback automático funciona
- Parsing dois formatos XML suportados

## Próximos Passos
Executar /tasks para gerar tasks.md e iniciar TDD.
