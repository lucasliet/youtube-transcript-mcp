# Repository Guidelines

## Project Structure & Module Organization
- `src/cli.js`: Entrypoint. Roda como servidor MCP (stdio) ou CLI one‑off.
- `src/tool/transcriptYt.js`: Implementação da ferramenta `transcript_yt`.
- `src/lib/*.js`: Utilitários (extração de ID, fetch/Innertube, seleção de track, parsing/normalização, logs).
- `src/index.js`: Exporta o array de tools (para hosts que importam o pacote).
- `tests/{unit,integration}/*.test.js`: Testes com `node:test` (unitários e de integração).
- `specs/001-init/*`: Planejamento, dados e quickstart do feature.

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
- Vincule à spec/tarefa quando aplicável (ex.: `specs/001-init/*`).

## Security & Configuration Tips
- Resposta MCP deve usar `content` com `type: "text"` contendo JSON serializado.
- Sem cache e sem truncamento: o consumidor decide paginação/tratamento.
- Requer Node 18+ com `fetch` nativo.
