# Tasks: Remote MCP Lifecycle Compatibility

**Input**: Design documents from `/specs/003-remote-sse-mcp/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
   → quickstart.md: Extract handshake scenarios → integration tests
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have model tasks?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Phase 3.1: Setup
- [ ] T001 Run `npm test` to verify current baseline before lifecycle changes (`npm test`).

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T002 [P] Add MCP lifecycle contract coverage in `tests/contract/mcpLifecycle.test.js` validating initialize/shutdown/exit envelopes against `specs/003-remote-sse-mcp/contracts/mcp-lifecycle.json`.
- [ ] T003 [P] Create integration tests for initialize → tools → shutdown → exit handshake flow in `tests/integration/remote_lifecycle.test.js` using remote server fixtures.
- [ ] T004 [P] Extend `tests/unit/remote_server.test.js` to cover session state gating (reject tools before initialize, allow reinitialize, block after shutdown).

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T005 Implement lifecycle state tracking in `src/server/clientSession.js` (status transitions, blocking new requests after shutdown, clean heartbeat on exit).
- [ ] T006 Update `src/server/sessionRegistry.js` to surface session state helpers and ensure connections are torn down on `exit`/timeout.
- [ ] T007 Enhance `src/server/messageRouter.js` to handle MCP `initialize`, `shutdown`, and `exit` methods, enforce ordering, and emit structured errors/logs consistent with docs.

## Phase 3.4: Integration
- [ ] T008 Adjust remote request workflow in `src/server/remoteServer.js` and related helpers (if needed) to ensure registry cleanup and heartbeat timers align with lifecycle state.

## Phase 3.5: Polish
- [ ] T009 Update public documentation in `README.md` (remote mode section) to describe the MCP lifecycle handshake and IDE usage.
- [ ] T010 Sync agent guidance in `AGENTS.md` (remote MCP instructions) with new lifecycle requirement and reference updated quickstart.
- [ ] T011 Review `.specify/memory/constitution.md` and update if lifecycle changes introduce new principles or governance adjustments.
- [ ] T012 Run full test suite (`npm test`) and document results in the PR description.

## Dependencies
- T001 must pass before writing new tests (T002–T004).
- T002–T004 must exist and fail before implementing lifecycle logic (T005–T008).
- T005 blocks T006 and T007; T007 must complete before T008.
- Documentation updates (T009, T010) happen after implementation (T005–T008).
- Final validation T012 depends on all prior tasks; constitution review T011 depends on implementation docs (T005–T010).

## Parallel Execution Example
```
# After T001 succeeds, execute tests in parallel:
agent -t "T002 Add MCP lifecycle contract coverage in tests/contract/mcpLifecycle.test.js"
agent -t "T003 Create integration tests for initialize → tools → shutdown → exit handshake flow in tests/integration/remote_lifecycle.test.js"
agent -t "T004 Extend tests/unit/remote_server.test.js to cover session state gating"
```

## Validation Checklist
- [x] All contracts have corresponding tests (T002)
- [x] All entities have model/service tasks (T005–T007)
- [x] All tests precede implementation (T002–T004 before T005–T008)
- [x] Parallel tasks operate on distinct files (T002–T004)
- [x] Each task lists exact file paths or commands
- [x] No parallel tasks modify the same file
- [x] Constitution principles satisfied (Plan.md: Constitution Check)
