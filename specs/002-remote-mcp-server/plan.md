# Implementation Plan: Remote MCP Server with SSE Support

**Branch**: `002-remote-mcp-server` | **Date**: 2025-09-15 | **Spec**: /Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/spec.md
**Input**: Feature specification from `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/spec.md`

## Execution Flow (/plan command scope)
```
1. Read feature spec and compile remote-mode requirements (done).
2. Populate Technical Context using project conventions (no NEEDS CLARIFICATION remaining).
3. Review constitution template (placeholder) and record adherence decisions.
4. Execute Phase 0 → summarise transport, session, error-handling decisions in research.md.
5. Execute Phase 1 → define data model, HTTP/SSE contracts, and quickstart guidance.
6. Re-run constitution checkpoint ensuring simplicity and TDD strategy remain intact.
7. Describe Phase 2 task generation approach (tasks.md to be produced later).
8. STOP.
```

## Summary
Extend the existing YouTube Transcript MCP CLI to expose an optional remote HTTP mode using Server-Sent Events. Remote clients connect via `GET /mcp/events`, receive a server-assigned `connectionId`, submit JSON-RPC requests with `POST /mcp/messages`, and stream responses (`ready`, `message`, `error`, `heartbeat`) without impacting stdio usage. The release keeps the tool contract identical and adds configuration flags for remote hosting, concurrency limits, and heartbeat/timeout controls.

## Technical Context
**Language/Version**: JavaScript ESM (Node >=18)
**Primary Dependencies**: @modelcontextprotocol/sdk, Node built-in `http`/`crypto` modules
**Storage**: None; all state in memory per session
**Testing**: node:test with new HTTP integration suites plus existing unit coverage
**Target Platform**: Node CLI (stdio) and HTTP server (remote mode)
**Project Type**: single
**Performance Goals**: Handle up to 10 concurrent clients with sub-60s transcript turnaround; heartbeat every 25s keeps SSE alive
**Constraints**: Maintain minimal logging, reuse transcript tool contract, expose no authentication while optionally enabling CORS, keep CLI backwards compatible
**Scale/Scope**: Lightweight remote service for interactive LLM agents (burst traffic, low sustained load)
**Arguments**: Nenhum argumento adicional fornecido via setup-plan

## Constitution Check
**Simplicity**:
- Projects: 1 (CLI + remote mode share same source tree)
- Using framework directly: Native Node HTTP APIs, no extra abstractions
- Single data model: Session/request/event entities only, no DTO layering
- Avoiding patterns: No repositories or background queues introduced

**Architecture**:
- Libraries: Reuse existing MCP tool library; new remote transport lives alongside CLI entrypoint
- CLI per library: Existing CLI gains mode switch; no extra binaries
- Library docs: quickstart documents remote usage for agents

**Testing (NON-NEGOTIABLE)**:
- Plan RED → GREEN: add failing tests for remote mode contracts before implementation
- Cover list/call flows, error propagation, heartbeat/timeout behaviour, concurrency guardrails
- Integration tests exercise HTTP endpoints with mocked transcript tool responses

**Observability**:
- Continue categorical logging (`invalid_request`, `tool_error`, etc.) with single-line summaries per session

**Versioning**:
- Maintain semantic versioning; bump minor when remote mode launches; ensure stdio API untouched

*Constitution template lacks concrete clauses; applied baseline simplicity/test-first interpretation used in spec 001.*

## Project Structure
### Documentation (this feature)
```
/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (future)
```
### Source Code (repository root)
```
/Users/lucas/Projetos/youtube-transcript-mcp/
├── src/
│   ├── cli.js              # add remote mode orchestration + flag parsing
│   ├── server/             # new module for HTTP/SSE transport (planned)
│   └── tool/transcriptYt.js# unchanged tool logic reused by both transports
└── tests/
    ├── integration/       # add remote HTTP tests with mocked fetch + SSE client
    └── unit/              # keep existing util coverage
```
**Structure Decision**: Single project with additional `server` module housing transport logic.

## Phase 0: Outline & Research
- Selected native Node HTTP + SSE endpoints (`GET /mcp/events`, `POST /mcp/messages`).
- Defined event taxonomy (`ready`, `message`, `error`, `heartbeat`) and envelope fields.
- Determined CLI flag surface: `--mode`, `--port`, `--host`, `--cors`, `--heartbeat`, `--request-timeout`, `--maxClients`.
- Planned in-memory session map with per-client request limit (1) and timeout guard using AbortController.
- Established error taxonomy reuse and structured SSE error payload referencing `error-event.json` contract.
- Documented optional CORS support and recommended deployment behind reverse proxy for TLS.

## Phase 1: Design & Contracts
- Documented entities (ServerConfig, ClientSession, RequestState, OutboundEvent, ErrorFrame) in `data-model.md`.
- Authored JSON schemas: `sse-connection.json`, `message-envelope.json`, `mcp-request-response.json`, `error-event.json` with README guidance.
- Created quickstart walkthrough covering installation, server launch, SSE connection, request submission, and teardown.
- No agent-specific context file required for Codex CLI; existing AGENTS.md remains unchanged.

## Phase 2: Task Planning Approach
- Tests-first ordering: create contract validation tests (schema validation + negative cases), SSE handshake integration tests, request routing tests, and error/timeout scenarios before implementation.
- Implementation tasks follow: CLI flag parsing, server bootstrap, session registry, message dispatch, SSE emitter, heartbeats, shutdown logic, concurrency guards.
- Parallelisable tasks `[P]`: schema validation helpers vs CLI parsing, SSE integration tests vs CLI option parsing.
- tasks.md (future) will translate each contract/test scenario into actionable items, keeping ~25 ordered steps.

## Complexity Tracking
*(none required; design stays within single-project constraint)*

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on placeholder constitution in `/Users/lucas/Projetos/youtube-transcript-mcp/.specify/memory/constitution.md`; will revisit if document is amended.*
