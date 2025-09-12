# Implementation Plan: YouTube Transcript MCP Tool

**Branch**: `001-init` | **Date**: 2025-09-11 | **Spec**: specs/001-init/spec.md
**Input**: Feature specification from `/specs/001-init/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
2. Fill Technical Context (scan for NEEDS CLARIFICATION) → none remain
3. Evaluate Constitution Check section → record simplicity approach
4. Execute Phase 0 → produce research.md (summarize constraints: no cache, full transcript, null on failure, logging minimal)
5. Execute Phase 1 → produce data-model.md (entities: VideoTranscriptRequest, TranscriptSegment), quickstart.md (usage via npx + MCP tool invocation). contracts/ not needed (no external HTTP API), justify omission.
6. Re-evaluate Constitution Check → confirm still simple (single project)
7. Plan Phase 2 → describe task generation strategy (tests-first for tool function, parsing, selection logic, error cases)
8. STOP
```

## Summary
Ferramenta MCP que recebe URL de vídeo YouTube e lista opcional de idiomas preferidos, retorna lista de segmentos (texto, startInMs, duration). Requisitos principais: equivalência funcional ao exemplo, sem cache, sem truncamento, apenas memória, logs mínimos, fallback de idioma, diferenciar causas em log mas payload de erro uniforme (null).

## Technical Context
**Language/Version**: JavaScript ESM (Node >=18)
**Primary Dependencies**: @modelcontextprotocol/sdk (MCP server), fetch API (nativo Node >=18)
**Storage**: Não utiliza armazenamento persistente
**Testing**: node:test (nativo, sem dependências)
**Target Platform**: Node (executado via npx no host MCP)
**Project Type**: single
**Performance Goals**: Processar transcrição típica (<2s) em rede normal
**Constraints**: Sem cache, sem truncamento interno, apenas memória; retorno uniforme null em falhas; respostas MCP devem usar tipos suportados (text)
**Scale/Scope**: Uso por agente LLM para poucas requisições interativas (baixa concorrência)

## Constitution Check
**Simplicity**:
- Projects: 1 (core MCP tool)
- Using framework directly? Sim (Node + fetch + xml parser)
- Single data model? Sim (Segmentos + request inline)
- Avoiding patterns? Sim (sem repos, sem DTO extra)

**Architecture**:
- Libraries: SDK MCP oficial; sem parser XML externo (regex)
- CLI per library: Não aplicável (npx entrypoint único)
- Library docs: Quickstart fornecerá uso

**Testing (NON-NEGOTIABLE)**:
- Ordem: Especificar testes antes da implementação completa
- Cobrir: extração de ID, seleção de track, parsing de XML (dois formatos), caminhos de erro

**Observability**:
- Logs mínimos: eventos de falha categorizados

**Versioning**:
- Versão inicial 0.1.0, seguir semantic versioning

## Project Structure
### Documentation (this feature)
```
specs/001-init/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (future)
```
### Source Code (repository root)
```
src/
  tool/                        # implementação da ferramenta MCP (JS)
  lib/                         # utilitários (JS)
  index.js                     # export main tool array
  cli.js                       # entrypoint MCP server/CLI
tests/
  integration/                 # fluxo completo mockando fetch (JS)
  unit/                        # funções utilitárias (JS)
```
**Structure Decision**: Single project

## Phase 0: Outline & Research
Decisions:
- Cache: omitido (especificação exige ausência)
- Truncamento: nenhum; consumidor trata
- Logging: apenas categorias (invalid_url, no_captions, inaccessible, network_error, other_error)
- Idioma: matching case-insensitive e prefixo
- Test Framework: node:test (nativo)
Alternatives: Adicionar cache (rejeitado), compressão de resposta (rejeitado), normalização avançada HTML (rejeitado; escopo mínimo), fast-xml-parser (rejeitado; regex suficiente)
Output: research.md

## Phase 1: Design & Contracts
Data Model: entidades conceituais TranscriptSegment, VideoTranscriptRequest (JS)
Contratos externos HTTP: inexistentes (ferramenta local). Quickstart cobre integração MCP.
Contract Tests: interface da função tool (entrada → saída) e validação dos handlers MCP (ListTools/CallTool) com tipos suportados
Quickstart: comando npx configuração mcp (GitHub main) + exemplo de chamada com preferredLanguages
Output: data-model.md, quickstart.md, diretório contracts/ com nota de ausência de endpoints

## Phase 2: Task Planning Approach
Task Generation Strategy:
- Derivar tarefas de: entidades (interfaces), funções utilitárias (extractVideoId, chooseTrack, parseSegments), fluxo principal, testes (unit → integration)
Ordering:
1. Definir interfaces
2. Escrever testes unitários para utilitários (falhando)
3. Implementar utilitários
4. Teste seleção de track (prioridades)
5. Teste parsing XML (dois formatos)
6. Testes de fluxo integração (sucesso, sem legendas, idioma fallback, URL inválida, vídeo inacessível)
7. Implementar função principal
8. Ajustes finais e quickstart
Estimated Output: ~20 tasks (adaptados para JS)

## Phase 3+: Future Implementation
Fora do escopo deste comando

## Complexity Tracking
(nenhuma violação)

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks adaptadas para JS (implícito)
- [x] Phase 4: Implementation complete (JS ESM + MCP server)
- [x] Phase 5: Validation passed (node --test integração + unit)

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (versão 0.1.0)
- [x] Complexity deviations documented (mudança para JS + retorno MCP type=text)

---
*Based on Constitution v2.1.1 - File not present; applied baseline principles explicit in template*
