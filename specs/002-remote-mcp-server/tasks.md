# Tasks: Remote MCP Server with SSE Support

**Input**: Design documents from `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory (completed).
2. Load optional design documents (research, data-model, contracts, quickstart) (completed).
3. Generate tasks grouped by setup, tests, core implementation, integration, polish.
4. Apply rules: tests precede implementation, different files allow [P], same file stay sequential.
5. Number tasks sequentially (T001, T002, ...).
6. Note key dependencies and parallel opportunities.
7. Provide parallel execution example commands.
8. Validate coverage against requirements (contracts, entities, endpoints, docs).
```

## Phase 3.1: Setup
- [ ] T001 Prepare remote testing helpers in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/helpers/remoteFixtures.js` with utilities to spawn the CLI in remote mode, open SSE streams, and stub transcript responses (no feature logic yet).

## Phase 3.2: Tests First (TDD)
**All tests below must be written and observed failing before implementation begins.**
- [ ] T002 [P] Author contract test for SSE handshake using `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/sse-connection.json` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/contract/sseConnection.test.js` validating response headers and `ready` event structure.
- [ ] T003 [P] Author contract test for message envelope schema from `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/message-envelope.json` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/contract/messageEnvelope.test.js` asserting POST `/mcp/messages` rejects malformed payloads.
- [ ] T004 [P] Author contract test for JSON-RPC relay using `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/mcp-request-response.json` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/contract/mcpTransport.test.js` ensuring responses match schema.
- [ ] T005 [P] Author contract test for error propagation with `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/error-event.json` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/contract/errorEvents.test.js` asserting SSE `error` events conform to payload contract.
- [ ] T006 [P] Add integration test `remote_success` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/integration/remote_success.test.js` covering transcript retrieval over SSE (acceptance scenario 1).
- [ ] T007 [P] Add integration test `remote_multi_clients` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/integration/remote_multi_clients.test.js` validating independent responses for simultaneous clients (acceptance scenario 2).
- [ ] T008 [P] Add integration test `remote_invalid_url` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/integration/remote_invalid_url.test.js` ensuring proper error emission for invalid video URLs (acceptance scenario 4).
- [ ] T009 [P] Add integration test `stdio_regression` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/integration/stdio_regression.test.js` verifying stdio mode remains functional without remote flags (acceptance scenario 3).
- [ ] T010 [P] Add integration test `remote_timeout_heartbeat` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/integration/remote_timeout_heartbeat.test.js` covering heartbeat cadence and request timeout behaviour.
- [ ] T011 [P] Add integration test `remote_max_clients` in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/integration/remote_max_clients.test.js` asserting the server enforces `maxClients` with structured errors.

## Phase 3.3: Core Implementation (execute only after all above tests fail)
- [ ] T012 [P] Implement `ServerConfig` parsing and validation per defaults in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/config.js`.
- [ ] T013 [P] Implement `ErrorFrame` formatter handling taxonomy codes in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/errorFrame.js`.
- [ ] T014 [P] Implement `OutboundEvent` builder covering `ready`, `message`, `error`, `heartbeat` in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/outboundEvent.js`.
- [ ] T015 [P] Implement `RequestState` lifecycle with abort support in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/requestState.js`.
- [ ] T016 [P] Implement `ClientSession` management (event id sequencing, heartbeat bookkeeping) in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/clientSession.js`.
- [ ] T017 Implement shared session registry with concurrency caps and cleanup in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/sessionRegistry.js`.
- [ ] T018 Implement SSE event stream handler establishing `GET /mcp/events` and emitting ready/heartbeat events in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/eventStreamHandler.js`.
- [ ] T019 Implement message router for `POST /mcp/messages` wiring MCP tool invocation and error mapping in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/messageRouter.js`.
- [ ] T020 Implement remote server bootstrap combining HTTP server, routing, and graceful shutdown in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/remoteServer.js`.
- [ ] T021 Update CLI entrypoint in `/Users/lucas/Projetos/youtube-transcript-mcp/src/cli.js` to parse remote flags, start remote server, and preserve stdio behaviour.

## Phase 3.4: Integration & Hardening
- [ ] T022 Add focused unit tests for config boundaries and session utilities in `/Users/lucas/Projetos/youtube-transcript-mcp/tests/unit/remote_server.test.js` to cover edge cases (e.g., timeout < heartbeat).
- [ ] T023 Implement instrumentation/log routing for remote mode using existing logging utilities in `/Users/lucas/Projetos/youtube-transcript-mcp/src/server/logging.js`, ensuring categorical logs align with stdio taxonomy.

## Phase 3.5: Polish
- [ ] T024 [P] Update documentation to reflect remote mode (refresh `/Users/lucas/Projetos/youtube-transcript-mcp/README.md`, `/Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/quickstart.md`, e `/Users/lucas/Projetos/youtube-transcript-mcp/AGENTS.md` com a nova estrutura e comandos).
- [ ] T025 [P] Replace placeholder constitution with actual project principles em `/Users/lucas/Projetos/youtube-transcript-mcp/.specify/memory/constitution.md` alinhando com as práticas vigentes.
- [ ] T026 Run full validation (`npm test`, `npm run lint`) e registrar resultados nas notas de mudança.

## Dependencies & Ordering Notes
- T001 sets up helpers required by contract and integration tests.
- T002–T011 must precede T012–T021 para reforçar RED → GREEN.
- T012–T016 criam entidades usadas por T017–T021; implementar antes das dependentes.
- T018 depende do registry (T017); T019 depende de RequestState e ErrorFrame (T013–T015).
- T020 depende dos handlers (T018–T019); T021 ajusta CLI após bootstrap remoto.
- T022 requer módulos principais concluídos; roda após T021.
- T023 depende de logging estrutural presente (T020).
- T024–T026 executam ao final após estabilidade funcional.

## Parallel Execution Example
```
# After T001, execute the contract test tasks in parallel:
Task: "T002 Author contract test for SSE handshake using /Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/sse-connection.json"
Task: "T003 Author contract test for message envelope schema from /Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/message-envelope.json"
Task: "T004 Author contract test for JSON-RPC relay using /Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/mcp-request-response.json"
Task: "T005 Author contract test for error propagation with /Users/lucas/Projetos/youtube-transcript-mcp/specs/002-remote-mcp-server/contracts/error-event.json"
```

## Validation Checklist
- [x] Every contract file mapped to a contract test task (T002–T005).
- [x] Every data-model entity mapped to a creation task (T012–T016).
- [x] All endpoints cobrindo `GET /mcp/events` e `POST /mcp/messages` via T018–T020 depois dos testes.
- [x] User stories representadas por testes de integração (T006–T011).
- [x] Documentação (README, quickstart, AGENTS) e constitution updates agendados (T024–T025).
- [x] Validação final garante lint e testes executados (T026).
