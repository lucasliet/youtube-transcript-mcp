# YouTube Transcript MCP Tool

[![Run tests](https://github.com/lucasliet/youtube-transcript-mcp/actions/workflows/run-tests.yml/badge.svg?branch=main)](https://github.com/lucasliet/youtube-transcript-mcp/actions/workflows/run-tests.yml)
[![Coverage Status](https://coveralls.io/repos/github/lucasliet/youtube-transcript-mcp/badge.svg?branch=main)](https://coveralls.io/github/lucasliet/youtube-transcript-mcp?branch=main)

Ferramenta MCP para obter transcrições de vídeos do YouTube com timestamps e fornecer para agentes LLM.

## Índice
- [Instalação / Uso via npx](#instalação--uso-via-npx)
- [Instalação como biblioteca](#instalação-como-biblioteca-npm-via-github)
- [Compatível com OpenAI SDK (Chat Completions Tools)](#compatível-com-openai-sdk-chat-completions-tools)
- [Configuração como MCP Server](#configuração-como-mcp-server)
- [Deploy no Deno Deploy (MCP Remoto)](#deploy-no-deno-deploy-mcp-remoto)
- [Formato de entrada e saída](#formato-de-entrade-e-saída)
- [Regras de Seleção de Legenda](#regras-de-seleção-de-legenda)
- [Comportamento de Erro](#comportamento-de-erro)
- [Limitações](#limitações)
- [Desenvolvimento](#desenvolvimento)
- [Testes Esperados](#testes-esperados)

## Instalação / Uso via npx
Via GitHub:
```bash
npx -y --package=github:lucasliet/youtube-transcript-mcp#main youtube-transcript-mcp --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"
```
Saída do CLI: JSON no stdout (array de segmentos) ou `null` em falha.

## Instalação como biblioteca (npm via GitHub)
Como o pacote não está publicado no npm, instale diretamente do GitHub:
```bash
npm i github:lucasliet/youtube-transcript-mcp#main
```
Import ESM:
```js
import tools from 'youtube-transcript-mcp'
```
`tools` é um array onde cada item é uma tupla `[name, { schema, fn }]`. O `schema` está pronto para ser passado ao `tools` da API do OpenAI, e `fn(args)` executa a ferramenta e retorna os segmentos.

## Compatível com OpenAI SDK (Chat Completions Tools)
Esta biblioteca já expõe a ferramenta no formato de schema esperado pelo OpenAI SDK para a API de Chat Completions (tools do tipo function). Você pode reaproveitar o schema diretamente e despachar a execução pelo `fn` exportado.

Exemplo de uso com `openai` (Node ESM):
```js
import OpenAI from 'openai'
import ytTools from 'youtube-transcript-mcp'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Extrai os schemas de tools no formato esperado pela API do OpenAI
const openaiTools = ytTools.map(([, t]) => t.schema)

const messages = [
  { role: 'user', content: 'Get transcript for https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
]

const res = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  tools: openaiTools
})

// Se o modelo pediu chamada de ferramenta, resolva e mantenha o histórico
if (res.choices?.[0]?.message?.tool_calls) {
  messages.push({
    role: 'assistant',
    content: res.choices[0].message.content || '',
    tool_calls: res.choices[0].message.tool_calls
  })

  for (const tool_call of res.choices[0].message.tool_calls) {
    const fnName = tool_call.function?.name
    const args = JSON.parse(tool_call.function?.arguments || '{}')
    const entry = ytTools.find(([n]) => n === fnName)
    if (!entry) continue
    const fn = entry[1].fn
    const result = await fn(args)
    messages.push({
      role: 'tool',
      tool_call_id: tool_call.id,
      content: JSON.stringify(result)
    })
  }

  // Opcional: Faça uma chamada de follow-up com o histórico atualizado
  const followUpRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages
  })
  console.log(followUpRes.choices[0].message.content)
}
```

## Configuração como MCP Server
Coloque no arquivo de configuração do host MCP:
```json
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

### Executando como servidor remoto (SSE)

Para iniciar o servidor remoto (Node.js ou Deno 2 localmente), use:

```bash
npm run start:remote --host 0.0.0.0 --port 3000 --cors "*"   # Node.js
# ou com Deno 2 (também funciona, pois node:http é compatível):
deno run --allow-net --allow-env --allow-read src/cli.js --mode remote --port 3000 --cors "*"
```

> **Nota:** O Deno 2 é compatível com `node:http` e consegue rodar o `start:remote` normalmente em ambiente local. O entrypoint `src/deno-deploy.js` só é necessário para o **Deno Deploy** (serverless/isolates), onde não existe processo persistente e `node:http .listen()` não funciona — apenas `Deno.serve()` é suportado.

Endpoints expostos:
- `GET /mcp`: abre o stream SSE, envia evento `endpoint` com `sessionId` e heartbeats.
- `POST /mcp?sessionId=<id>`: recebe frames JSON-RPC (`initialize`, `tools/list`, `tools/call`, `shutdown`) identificados pelo query param ou cabeçalho `Mcp-Session-Id`.

Recursos chave:
- Handshake MCP (`initialize`/`shutdown`) tratado automaticamente pelo SDK.
- `Mcp-Session-Id` exposto via header para transporte HTTP e SSE.
- Compatibilidade legada: `/mcp/events` e `/mcp/messages` retornam mensagens de migração.
- Conexões liveness: heartbeats periódicos e limpeza de sessões expiradas.

Flags úteis:
- `--host`: Host/IP para bind do servidor (padrão: `0.0.0.0`)
- `--port`: Porta do servidor (padrão: `3000`)
- `--cors`: Configuração CORS (`false`, `*` ou origem específica)
- `--heartbeat-interval`: Intervalo de heartbeat em ms (padrão: `25000`)
- `--request-timeout`: Timeout de request em ms (padrão: `60000`, deve ser > heartbeat)
- `--max-clients`: Máximo de clientes simultâneos (padrão: `10`)

## Deploy no Deno Deploy (MCP Remoto)

Um servidor remoto já está disponível publicamente em:

**`https://youtube-transcript-mcp.deno.dev`**

### Usar o servidor público

Configure diretamente no seu host MCP (Claude Desktop, Cursor, VS Code, etc.):

```json
{
  "mcpServers": {
    "youtube-transcript-remote": {
      "url": "https://youtube-transcript-mcp.deno.dev/mcp"
    }
  }
}
```

### Por que um entrypoint separado para Deno Deploy?

O Deno Deploy é serverless (isolates): não existe processo persistente, então `node:http .listen()` não funciona. O `src/deno-deploy.js` implementa o protocolo MCP/SSE usando exclusivamente a Web Fetch API (`Deno.serve`, `Request`, `Response`, `ReadableStream`), que é o único modelo suportado.

Em ambiente local, o Deno 2 é compatível com `node:http` e o `start:remote` funciona normalmente — o entrypoint dedicado só é necessário para o Deno Deploy.

### Fazer seu próprio deploy

```bash
# 1. Instalar deployctl
deno install -gArf jsr:@deno/deployctl

# 2. Autenticar (abre browser)
deployctl login

# 3. Deploy
deployctl deploy --project=<nome-do-projeto> src/deno-deploy.js
```

### Testar localmente antes do deploy

```bash
deno task start   # porta 8000

curl -N http://localhost:8000/mcp
# event: endpoint
# data: "/mcp?sessionId=<uuid>"
```

### Protocolo SSE exposto

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/mcp` | Abre stream SSE, envia `event: endpoint` com o `sessionId` |
| `POST` | `/mcp?sessionId=<id>` | Recebe mensagem JSON-RPC, retorna HTTP 202, envia resposta pelo SSE |
| `OPTIONS` | `*` | CORS preflight (permite `*`) |

Métodos MCP suportados: `initialize`, `ping`, `tools/list`, `tools/call`.

## Formato de entrade e saída
Entrada:
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "preferredLanguages": ["pt-BR", "en"]
}
```
Saída (exemplo abreviado)
CLI:
```json
[
  { "text": "Intro...", "startInMs": 0, "duration": 2300 },
  { "text": "Next segment...", "startInMs": 2300, "duration": 1800 }
]
```
MCP (content type text):
```json
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
- Node 18+ / Deno 2+
- JavaScript ESM

Scripts:
```bash
npm test           # testes Node
npm run lint       # ESLint
npm run start:deno # servidor Deno local (porta 8000)
npm run dev:deno   # servidor Deno com watch
```

## Testes Esperados
- URL inválida → `null`
- Sem legendas → `null`
- Fallback automático de idioma funciona
- Parsing de dois formatos XML suportados
