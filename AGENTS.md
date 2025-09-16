# Repository Guidelines

## Project Structure & Module Organization
- `src/cli.js`: Entrypoint. Roda como servidor MCP (stdio) ou servidor remoto SSE.
- `src/server/*.js`: Transporte HTTP/SSE (config, sessões, handlers, bootstrap).
- `src/tool/transcriptYt.js`: Implementação da ferramenta `transcript_yt`.
- `src/lib/*.js`: Utilitários (extração de ID, fetch/Innertube, seleção de track, parsing/normalização, logs).
- `src/index.js`: Exporta o array de tools (para hosts que importam o pacote).
- `tests/{unit,integration,contract}/*.test.js`: Testes com `node:test`.
- `specs/###-feature/*`: Documentos de spec/plan/tasks por feature.
- `.specify/…`: Infraestrutura do spec-kit (memórias, scripts, templates).

## Build, Test, and Development Commands
- `node src/cli.js`: Inicia o servidor MCP via stdio.
- `node src/cli.js --videoUrl "https://www.youtube.com/watch?v=VIDEO_ID" --preferredLanguages "pt-BR,en"`: Execução one‑off (imprime JSON no stdout).
- `npm test`: Executa todos os testes (`node --test tests/**/*.test.js`).
- Host MCP (via GitHub): `npx -y --package=github:lucasliet/youtube-transcript-mcp#main youtube-transcript-mcp`.

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

## Commit & Pull Request Guidelines
- Commits curtos, no imperativo, descrevendo a ação e escopo (ex.: `mcp: fix tools/call content type`).
- PRs devem: descrever o problema, solução, impacto, e apontar arquivos tocados. Inclua exemplos de uso (comandos) e logs relevantes.
- Vincule à spec/tarefa quando aplicável (ex.: `.specify/002-remote-mcp-server/*`).

## Security & Configuration Tips
- Resposta MCP deve usar `content` com `type: "text"` contendo JSON serializado.
- Sem cache e sem truncamento: o consumidor decide paginação/tratamento.
- Requer Node 18+ com `fetch` nativo.

## Manutenção do AGENTS.md
- Sempre que, durante a implementação, alguma instrução do projeto aqui documentada mudar, atualize este AGENTS.md para refletir as instruções atualizadas.
