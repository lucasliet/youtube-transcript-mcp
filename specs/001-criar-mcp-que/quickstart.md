# Quickstart: YouTube Transcript MCP Tool

## Instalação / Uso via npx
```
npx youtube-transcript-mcp --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"
```
Retorna JSON no stdout com a lista de segmentos ou `null` em falha.

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

## Chamada
Entrada:
```
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "preferredLanguages": ["pt-BR", "en"]
}
```
Saída (exemplo abreviado):
```
[
  { "text": "Intro...", "startInMs": 0, "duration": 2300 },
  { "text": "Next segment...", "startInMs": 2300, "duration": 1800 }
]
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
