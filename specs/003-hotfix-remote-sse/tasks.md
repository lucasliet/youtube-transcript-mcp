# Tasks: Remote SSE MCP Lifecycle Hotfix

**Input**: Design documents from `specs/003-hotfix-remote-sse/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → SDK migration approach: Replace custom transport with @modelcontextprotocol/typescript-sdk
   → Tech stack: Node.js ESM 18+, SDK, Express.js integration
   → Structure: single project (src/, tests/)
2. Load design documents ✓:
   → data-model.md: SDK transport entities, session state machine
   → contracts/: SDK integration contracts (initialize, shutdown)
   → research.md: SDK adoption decisions, dual transport strategy
   → quickstart.md: SDK validation scenarios
3. Generate SDK migration tasks by category:
   → Setup: SDK dependencies, Express integration
   → Tests: SDK contract tests, integration tests
   → Core: SDK server, transport registry, session management
   → Integration: CLI integration, backwards compatibility
   → Polish: validation tests, documentation updates
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness ✓
9. Return: SUCCESS (SDK migration tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- All paths relative to repository root

## Phase 3.1: SDK Setup
- [ ] T001 Install Express.js dependency for SDK integration (`npm install express`)
- [ ] T002 [P] Configure ESLint for SDK TypeScript imports in `eslint.config.js`
- [ ] T003 [P] Update package.json scripts for SDK server mode

## Phase 3.2: SDK Contract Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] SDK integration contract test in `tests/contract/sdk_integration.test.js`
- [ ] T005 [P] Backwards compatibility contract test in `tests/contract/backwards_compat.test.js`
- [ ] T006 [P] Transport switching contract test in `tests/contract/transport_switching.test.js`
- [ ] T007 [P] SDK initialize contract test in `tests/contract/sdk_initialize.test.js`
- [ ] T008 [P] SDK shutdown contract test in `tests/contract/sdk_shutdown.test.js`
- [ ] T009 [P] SDK session management test in `tests/contract/sdk_session_registry.test.js`
- [ ] T010 [P] SDK state transitions validation test in `tests/contract/sdk_state_machine.test.js`
- [ ] T011 [P] SDK error codes contract test in `tests/contract/sdk_error_codes.test.js`

## Phase 3.3: SDK Integration Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
- [ ] T012 [P] SDK lifecycle integration test in `tests/integration/sdk_lifecycle.test.js`
- [ ] T013 [P] IDE client compatibility test in `tests/integration/ide_client_compat.test.js`
- [ ] T014 [P] Session cleanup integration test in `tests/integration/session_cleanup.test.js`
- [ ] T015 [P] SDK tool registration integration test in `tests/integration/sdk_tool_registration.test.js`
- [ ] T016 [P] Legacy endpoint deprecation test in `tests/integration/legacy_endpoint_migration.test.js`
- [ ] T017 [P] Pre-initialize error handling test in `tests/integration/sdk_error_scenarios.test.js`
- [ ] T018 [P] Claude Desktop configuration test in `tests/integration/ide_configuration.test.js`

## Phase 3.4: Core SDK Implementation (ONLY after tests are failing)
- [ ] T018 [P] SDK server configuration in `src/server/sdk-config.js`
- [ ] T019 [P] SDK transport registry in `src/server/sdk-transport-registry.js`
- [ ] T020 SDK remote server migration in `src/server/remote-server.js` (replace custom implementation)
- [ ] T021 SDK Express app integration in `src/server/sdk-express-app.js`
- [ ] T022 CLI remote mode integration with SDK in `src/cli.js`
- [ ] T023 [P] SDK error logging categorization in `src/lib/log.js`

## Phase 3.5: SDK Cleanup
- [ ] T024 Remove custom session files: `src/server/client-session.js`, `src/server/session-registry.js`
- [ ] T025 Remove custom message routing: `src/server/message-router.js`
- [ ] T026 Remove custom SSE handling: `src/server/event-stream-handler.js`
- [ ] T027 Update error handling to use SDK error responses in `src/server/error-frame.js`

## Phase 3.6: Integration & Compatibility
- [ ] T028 Stdio mode compatibility validation (ensure no regression)
- [ ] T029 Tool registration via SDK McpServer.registerTool() integration
- [ ] T030 Legacy endpoint deprecation handling (return migration guidance)
- [ ] T031 CORS configuration for SDK transports
- [ ] T032 [P] Constitutional compliance validation (single tool focus)

## Phase 3.7: Enhanced Error & Validation Testing
- [ ] T033 [P] Missing headers error scenario test in `tests/integration/missing_headers.test.js`
- [ ] T034 [P] Protocol version mismatch test in `tests/integration/protocol_mismatch.test.js`
- [ ] T035 [P] Session timeout cleanup test in `tests/integration/session_timeout.test.js`
- [ ] T036 [P] Multiple initialize attempts test in `tests/integration/multiple_initialize.test.js`

## Phase 3.8: Polish & Validation
- [ ] T037 [P] SDK configuration unit tests in `tests/unit/sdk_config.test.js`
- [ ] T038 [P] Transport registry unit tests in `tests/unit/sdk_transport_registry.test.js`
- [ ] T039 Execute quickstart.md validation scenarios (all phases)
- [ ] T040 Performance validation: SDK session handling vs custom implementation
- [ ] T041 [P] Update AGENTS.md with SDK architecture changes
- [ ] T042 [P] Update documentation for SDK-based remote mode
- [ ] T043 Troubleshooting scenarios validation from quickstart.md

## Phase 3.6: Integration & Compatibility
- [ ] T022 Stdio mode compatibility validation (ensure no regression)
- [ ] T023 Tool registration via SDK McpServer.registerTool() integration
- [ ] T024 Legacy endpoint deprecation handling (return migration guidance)
- [ ] T025 CORS configuration for SDK transports

## Phase 3.7: Polish & Validation
- [ ] T026 [P] SDK configuration unit tests in `tests/unit/sdk_config.test.js`
- [ ] T027 [P] Transport registry unit tests in `tests/unit/sdk_transport_registry.test.js`
- [ ] T028 Execute quickstart.md validation scenarios
- [ ] T029 Performance validation: SDK session handling vs custom implementation
- [ ] T030 [P] Update AGENTS.md with SDK architecture changes
- [ ] T031 [P] Update documentation for SDK-based remote mode

## Dependencies
- Setup (T001-T003) before tests (T004-T017)
- Contract tests (T004-T010) before integration tests (T011-T017)
- All tests before implementation (T018-T032)
- T018 (SDK config) blocks T019, T020, T021
- T020 (remote server) blocks T022 (CLI integration)
- T024-T027 (cleanup) after T018-T022 (new implementation)
- Core implementation before enhanced testing (T033-T036)
- Implementation before validation (T037-T043)

## Parallel Example
```bash
# Launch SDK contract tests together (T004-T010):
Task: "SDK StreamableHTTP transport test in tests/contract/sdk_streamable_http.test.js"
Task: "SDK SSE transport test in tests/contract/sdk_sse_transport.test.js"
Task: "SDK initialize contract test in tests/contract/sdk_initialize.test.js"
Task: "SDK shutdown contract test in tests/contract/sdk_shutdown.test.js"
Task: "SDK session management test in tests/contract/sdk_session_registry.test.js"
Task: "SDK state transitions validation test in tests/contract/sdk_state_machine.test.js"
Task: "SDK error codes contract test in tests/contract/sdk_error_codes.test.js"

# Launch SDK integration tests together (T011-T017):
Task: "SDK dual transport integration test in tests/integration/sdk_dual_transport.test.js"
Task: "SDK IDE client compatibility test in tests/integration/sdk_ide_client.test.js"
Task: "SDK backwards compatibility test in tests/integration/sdk_legacy_client.test.js"
Task: "SDK tool registration integration test in tests/integration/sdk_tool_registration.test.js"
Task: "Legacy endpoint deprecation test in tests/integration/legacy_endpoint_migration.test.js"
Task: "Pre-initialize error handling test in tests/integration/sdk_error_scenarios.test.js"
Task: "Claude Desktop configuration test in tests/integration/ide_configuration.test.js"
```

## SDK Migration Strategy
**From Custom → To SDK**:
- `src/server/remote-server.js`: Replace HTTP server with Express + SDK transports
- `src/server/client-session.js` → SDK automatic session management
- `src/server/message-router.js` → SDK automatic JSON-RPC routing
- `src/server/session-registry.js` → SDK transport registry
- `src/server/event-stream-handler.js` → SDK SSE transport

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing SDK integration
- Commit after each task
- SDK handles: initialize/shutdown, session state, protocol headers, error handling
- Maintain stdio mode unchanged (constitutional requirement)

## Task Generation Rules Applied
*From Complete Design Documents*:

1. **From Contracts (complete)**:
   - initialize-request.json → T006 SDK initialize contract test [P]
   - initialize-response.json → T006 SDK initialize contract test [P]
   - shutdown-request.json → T007 SDK shutdown contract test [P]
   - Transport configuration schemas → T004, T005 transport tests [P]
   
2. **From Data Model (complete)**:
   - TransportRegistry entity → T019 SDK transport registry [P]
   - SessionState entity → T008 SDK session management test [P]
   - State Transitions → T009 SDK state transitions validation test [P]
   - SDKSessionConfig → T018 SDK server configuration [P]
   - MCPErrorCodes → T010 SDK error codes contract test [P]
   - BackwardsCompatibilityConfig → T015 legacy endpoint deprecation test [P]
   
3. **From Quickstart Scenarios (complete)**:
   - StreamableHTTP testing → T004 SDK StreamableHTTP transport test [P]
   - SSE testing → T005 SDK SSE transport test [P]
   - IDE compatibility → T012 SDK IDE client compatibility test [P]
   - Legacy endpoint testing → T015 legacy endpoint deprecation test [P]
   - Pre-initialize errors → T016 pre-initialize error handling test [P]
   - Missing headers → T033 missing headers error scenario test [P]
   - Protocol mismatch → T034 protocol version mismatch test [P]
   - Claude Desktop config → T017 Claude Desktop configuration test [P]
   - Troubleshooting → T043 troubleshooting scenarios validation
   - All validation phases → T039 execute quickstart.md validation scenarios

4. **From Research Decisions (complete)**:
   - SDK adoption → T001-T003 setup tasks
   - Express integration → T021 SDK Express app integration
   - Dual transport → T011 SDK dual transport integration test [P]
   - Error logging enhancement → T023 SDK error logging categorization [P]
   - Constitutional alignment → T032 constitutional compliance validation [P]

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T006, T007, T004, T005)
- [x] All entities have implementation tasks (T018, T019, T020, T021)
- [x] All tests come before implementation (T004-T017 before T018-T032)
- [x] Parallel tasks truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] SDK migration preserves stdio mode compatibility
- [x] Constitutional compliance maintained (single tool, simplicity, TDD)
- [x] All quickstart scenarios covered (T039, T043)
- [x] All error scenarios tested (T010, T016, T033-T036)
- [x] Legacy compatibility maintained (T013, T015, T030)