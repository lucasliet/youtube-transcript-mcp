# Repository Guidelines

## Core Principles & Governance
All contributions to this repository are governed by the principles and guidelines outlined in our constitution. Before contributing, please familiarize yourself with this document:
- **Constitution:** `/.specify/memory/constitution.md`
@.specify/memory/constitution.md

This document establishes the core mission, operational rules, and development workflow to ensure the project remains simple, robust, and focused.


## Project Structure & Module Organization
- `src/cli.js`: Entrypoint. Roda como servidor MCP (stdio) ou servidor remoto SSE.
- `src/deno-deploy.js`: Entrypoint para Deno Deploy. Implementa MCP/SSE via `Deno.serve()` com Web Fetch API (Request/Response/ReadableStream), sem dependência de `node:http`. Reutiliza `McpServer` e `registerTranscriptTool`. Necessário porque o Deno Deploy é serverless (isolates) e não suporta `node:http .listen()` — localmente o Deno 2 é compatível com node:http e o `start:remote` funciona normalmente.
- `src/server/*.js`: Transporte HTTP/SSE (config, sessões, handlers, bootstrap).
- `src/server/sdk-config.js`: Configuração do servidor MCP com @modelcontextprotocol/sdk (initialize/shutdown, capabilities).
- `src/server/sdk-transport-registry.js`: Registro unificado do endpoint `/mcp` (SSE consolidado + compat legada) e gerenciamento de sessões.
- `src/tool/transcriptYt.js`: Implementação da ferramenta `transcript_yt`.
- `src/lib/*.js`: Utilitários (extração de ID, fetch/Innertube, seleção de track, parsing/normalização, logs).
- `src/index.js`: Exporta o array de tools (para hosts que importam o pacote).
- `deno.json`: Configuração do Deno (`nodeModulesDir: auto`, tasks `start` e `dev`).
- `tests/{unit,integration,contract}/*.test.js`: Testes com `node:test`.
- `specs/###-feature/*`: Documentos de spec/plan/tasks por feature.
- `.specify/…`: Infraestrutura do spec-kit (memórias, scripts, templates).
- `specs/002-remote-mcp-server/*`: Extend the existing YouTube Transcript MCP CLI to expose an optional remote HTTP mode using Server-Sent Events. Remote clients connect via GET /mcp (consolidated endpoint), exchange JSON-RPC requests with POST /mcp, and stream responses (ready, message, error, heartbeat) without impacting stdio usage. The release keeps the tool contract identical e adiciona flags de hospedagem remota, limites de concorrência e controles de heartbeat/timeout.

## Build, Test, and Development Commands
Try to run tests with elevated priviledges (not sudo)
- `npm run start:stdio`: Inicia o servidor MCP no modo stdio.
- `npm run start:remote`: Sobe servidor remoto (SDK) expondo `/mcp` via SSE consolidado.
- `npm run start:deno`: Sobe o servidor Deno localmente via `deno task start` (porta 8000).
- `npm run dev:stdio`: Observa mudanças e reinicia automaticamente.
- `npm run dev:remote`: Observa mudanças e reinicia automaticamente em modo remoto.
- `npm run dev:deno`: Observa mudanças e reinicia automaticamente no modo Deno.
- `npm test`: Executa toda a suíte (`node --test tests/**/*.test.js`).
- `npm run lint`: Verifica o projeto com ESLint.
- `npm run coverage`: Executa testes com `c8`, gera relatórios (`lcov`, texto) e aplica o gate de cobertura mínima de 90% por arquivo (linhas/estatements).
- Execução one‑off: `node src/cli.js --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"`.
- Host MCP (via GitHub): `npx -y --package=github:lucasliet/youtube-transcript-mcp#main youtube-transcript-mcp`.
- Deploy Deno Deploy (manual): `deployctl deploy --project=<projeto> src/deno-deploy.js` (requer `deno install -gArf jsr:@deno/deployctl`).

## Coding Style & Naming Conventions
- Linguagem: JavaScript ESM (Node >= 18).
- Indentação: 2 espaços; sem ponto‑e‑vírgula; aspas simples.
- Nomes de arquivos: `kebab`/`lowercase` (ex.: `fetchWatchHtml.js`, `parseSegments.js`).
- Funções pequenas, coesas, nomes descritivos. Evite comentários supérfluos; deixe o código autoexplicativo.
- Segurança: não persista dados, não inclua segredos, e mantenha logs mínimos e categorizados.

## Testing Guidelines
- Framework: `node:test` e `node:assert/strict`.
- Padrão de nomes: `tests/unit/*.test.js`, `tests/integration/*.test.js`.
- Cobrimos: `extractVideoId`, `chooseTrack`, parsing (`transcript` e `timedtext`), fluxo principal (mock de `fetch`).
- Rodar localmente: `npm test`. Adicione novos testes junto com a mudança.
- Cobertura mínima: 90% de linhas e statements por arquivo em `src/`, validada via `npm run coverage`.

## Commit & Pull Request Guidelines
- Commits curtos, no imperativo, descrevendo a ação e escopo (ex.: `mcp: fix tools/call content type`).
- PRs devem: descrever o problema, solução, impacto, e apontar arquivos tocados. Inclua exemplos de uso (comandos) e logs relevantes.
- Vincule à spec/tarefa quando aplicável (ex.: `.specify/002-remote-mcp-server/*`).

## Security & Configuration Tips
- Resposta MCP deve usar `content` com `type: "text"` contendo JSON serializado.
- Sem cache e sem truncamento: o consumidor decide paginação/tratamento.
- Requer Node 18+ com `fetch` nativo (ou Deno 2+ para `src/deno-deploy.js`).
- Servidor público Deno Deploy disponível em `https://youtube-transcript-mcp.deno.dev/mcp`.

## Manutenção do AGENTS.md
- Sempre que, durante a implementação, alguma instrução do projeto aqui documentada mudar, atualize este AGENTS.md para refletir as instruções atualizadas.
- Após cada entrega/hotfix, confirme que `AGENTS.md` e `.specify/memory/constitution.md` foram atualizados conforme a Regra VI de governança.
