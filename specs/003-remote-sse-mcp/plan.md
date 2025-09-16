# Implementation Plan: Remote MCP Lifecycle Compatibility

**Branch**: `003-remote-sse-mcp` | **Date**: 2025-09-16 | **Spec**: /Users/lucas/Projetos/Pessoal/youtube-transcript-mcp/specs/003-remote-sse-mcp/spec.md
**Input**: Feature specification from `/specs/003-remote-sse-mcp/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
O modo remoto SSE precisa aderir ao ciclo MCP (`initialize`, `shutdown`, `exit`) para que IDEs funcionem igual ao modo stdio. Vamos adicionar controle de estado por sessão, respostas JSON-RPC alinhadas à especificação e documentação orientando integradores.

## Technical Context
**Language/Version**: Node.js 18  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, módulos HTTP padrão, utilitários existentes (`clientSession`, `sessionRegistry`, `messageRouter`)  
**Storage**: N/A (estado em memória)  
**Testing**: `node:test` com fixtures de remote server  
**Target Platform**: Servidor Node exposto via SSE  
**Project Type**: single  
**Performance Goals**: Responder `initialize` dentro de `requestTimeoutMs` (60s padrão) e manter heartbeat a cada `heartbeatIntervalMs` (25s)  
**Constraints**: Sem novas dependências externas; paridade com modo stdio; logs discretos seguindo categorias atuais  
**Scale/Scope**: Até `maxClients` sessões simultâneas isoladas

## Constitution Check
- **Princípio I**: mantém foco na ferramenta `transcript_yt` sem novas ferramentas.
- **Princípio II**: aproveita infraestrutura Node nativa e módulos já existentes.
- **Princípio III**: plano antecipa testes unitários/integrados antes de implementação.
- **Princípio IV**: reutiliza categorias de log `invalid_request`, `tool_error`, `other_error`.
- **Princípio V**: resguarda tempo limite e não introduz segredos.

Status: PASS (sem violações identificadas).

## Project Structure

### Documentation (this feature)
```
specs/003-remote-sse-mcp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (gerado por /tasks)
```

### Source Code (repository root)
```
src/
├── server/
│   ├── clientSession.js
│   ├── sessionRegistry.js
│   ├── messageRouter.js
│   └── ...
└── tool/

tests/
├── unit/
├── integration/
└── contract/
```

**Structure Decision**: Option 1 (single project) mantida.

## Phase 0: Outline & Research
1. Identificar lacunas: expectativas do handshake MCP, estado pós-shutdown, política de rejeição para chamadas fora de ordem.
2. Tarefas de pesquisa: comportamento padrão MCP, padrões SSE para encerramento limpo, mensagens de erro consistentes.
3. Consolidar conclusões em `research.md` com decisões, racional e alternativas.

## Phase 1: Design & Contracts
1. Descrever entidades e estados no `data-model.md` (LifecycleSession, LifecycleMessage, ErrorFrame existente).
2. Criar contrato JSON para envelopes MCP em `contracts/mcp-lifecycle.json` cobrindo `initialize`, `shutdown`, `exit` e erros.
3. Planejar testes unitários/integrados com base em requisitos FR-001..FR-007.
4. Atualizar `quickstart.md` com fluxo handshake para IDEs e cURL.
5. Registrar mudanças relevantes para agentes (via update-agent-context quando aplicável) sem inflar documentação existente.

## Phase 2: Task Planning Approach
- /tasks irá mapear cada requisito a testes e implementação (TDD).
- Ordem sugerida: testes de validação de lifecycle → implementação stateful → testes integração → documentação.
- Marcar itens independentes com [P] para paralelização (ex.: testes unitários distintos).

## Phase 3+: Future Implementation
Fora do escopo deste plano; seguir fluxo /tasks → implementação → validação.

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| *(nenhuma)* | | |

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.0.0 - See `/.specify/memory/constitution.md`*
