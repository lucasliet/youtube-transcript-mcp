# Tasks: Remote SSE MCP Lifecycle Hotfix

**Input**: Design documents from `specs/003-hotfix-remote-sse/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## From Research Decisions (complete):
   - SDK adoption → T001-T002 setup tasks
   - Dual transport → T011 SDK lifecycle integration test [P]
   - Error logging enhancement → T022 SDK error logging categorization [P]
   - Constitutional alignment → T031-T032 constitutional compliance validation [P]

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T006, T007, T003, T004)
- [x] All entities have implementation tasks (T018, T019, T020, T021)
- [x] All tests come before implementation (T003-T017 before T018-T032)
- [x] Parallel tasks truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] SDK migration preserves stdio mode compatibility
- [x] Constitutional compliance maintained (single tool, simplicity, TDD)
- [x] All quickstart scenarios covered (T039, T043)
- [x] All error scenarios tested (T010, T016, T033-T036)
- [x] Legacy compatibility maintained (T012, T015, T029)

## Functional Requirements Coverage

**✅ ALL 14 FRs COVERED:**
- FR-001 (initialize handler) → T006 SDK initialize contract test
- FR-002 (shutdown handler) → T007 SDK shutdown contract test
- FR-003 (endpoint consolidation) → T029 Legacy endpoint deprecation
- FR-004 (protocol headers) → T033 Missing headers error test
- FR-005 (remove envelope) → T020 SDK remote server migration
- FR-006 (session state validation) → T009 SDK state transitions test
- FR-007 (capabilities negotiation) → T006 SDK initialize contract test
- FR-008 (JSON-RPC contracts) → T006-T007 initialize/shutdown tests
- FR-009 (session cleanup) → T013 Session cleanup integration test
- FR-010 (IDE config format) → T017 Claude Desktop configuration test
- FR-011 (SDK migration) → T003-T026 (entire SDK migration)
- FR-012 (update AGENTS.md) → T041 Update AGENTS.md
- FR-013 (assess constitution.md) → T031 Constitutional compliance validation
- FR-014 (add governance rule) → T032 Add governance rule to constitution.mdrt.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → SDK migration approach: Replace custom transport with @modelcontextprotocol/typescript-sdk
   → Tech stack: Node.js ESM 18+, modelcontextprotocol SDK
   → Structure: single project (src/, tests/)
2. Load design documents ✓:
   → data-model.md: SDK transport entities, session state machine
   → contracts/: SDK integration contracts (initialize, shutdown)
   → research.md: SDK adoption decisions, dual transport strategy
   → quickstart.md: SDK validation scenarios
3. Generate SDK migration tasks by category:
   → Setup: SDK dependencies
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
- [x] T001 [P] Configure ESLint for SDK TypeScript imports in `eslint.config.js`
- [x] T002 [P] Update package.json scripts for SDK server mode

## Phase 3.2: SDK Contract Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T003 [P] SDK integration contract test in `tests/contract/sdk_integration_contract.test.js`
- [x] T004 [P] Backwards compatibility contract test in `tests/contract/backwards_compatibility_contract.test.js`
- [x] T005 [P] Transport switching contract test in `tests/contract/transport_switching_contract.test.js`
- [x] T006 [P] SDK initialize contract test in `tests/contract/sdk_initialize_contract.test.js`
- [x] T007 [P] SDK shutdown contract test in `tests/contract/sdk_shutdown_contract.test.js`
- [x] T008 [P] SDK session management test in `tests/contract/sdk_session_management_contract.test.js`
- [x] T009 [P] SDK state transitions validation test in `tests/contract/sdk_state_transitions_validation.test.js`
- [x] T010 [P] SDK error codes contract test in `tests/contract/sdk_error_codes_contract.test.js`

## Phase 3.3: SDK Integration Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
- [x] T011 [P] SDK lifecycle integration test in `tests/integration/sdk_lifecycle_integration.test.js`
- [x] T012 [P] IDE client compatibility test in `tests/integration/ide_client_compatibility_integration.test.js`
- [x] T013 [P] Session cleanup integration test in `tests/integration/session_cleanup_integration.test.js`
- [x] T014 [P] SDK tool registration integration test in `tests/integration/sdk_tool_registration_integration.test.js`
- [x] T015 [P] Legacy endpoint deprecation test in `tests/integration/legacy_endpoint_deprecation_integration.test.js`
- [x] T016 [P] Pre-initialize error handling test in `tests/integration/pre_initialize_error_handling_integration.test.js`
- [x] T017 [P] Claude Desktop configuration test in `tests/integration/claude_desktop_configuration_integration.test.js`

## Phase 3.4: Core SDK Implementation (ONLY after tests are failing)
- [x] T018 [P] SDK server configuration in `src/server/sdk-config.js`
- [x] T019 [P] SDK transport registry in `src/server/sdk-transport-registry.js`
- [x] T020 SDK remote server migration in `src/server/remote-server.js` (replace custom implementation)
- [x] T021 CLI remote mode integration with SDK in `src/cli.js`
- [x] T022 [P] SDK error logging categorization in `src/lib/log.js`

## Phase 3.5: SDK Cleanup
- [x] T023 Remove custom session files: `src/server/client-session.js`, `src/server/session-registry.js`
- [x] T024 Remove custom message routing: `src/server/message-router.js`
- [x] T025 Remove custom SSE handling: `src/server/event-stream-handler.js`
- [x] T026 Update error handling to use SDK error responses in `src/server/error-frame.js`

## Phase 3.6: Integration & Compatibility
- [x] T027 Stdio mode compatibility validation (ensure no regression)
- [ ] T028 Tool registration via SDK McpServer.registerTool() integration (pending: add registerTool-based wiring)
- [ ] T029 Legacy endpoint deprecation handling (return migration guidance) (pending: respond with migration guidance on legacy endpoints)
- [x] T030 SDK CORS configuration with exposedHeaders: ['Mcp-Session-Id'] and allowedOrigins validation
- [x] T031 [P] Constitutional compliance validation (single tool focus)
- [x] T032 [P] Add governance rule to constitution.md requiring AGENTS.md/constitution.md updates after implementations

## Phase 3.7: Enhanced Error & Validation Testing
- [x] T033 [P] Missing headers error scenario test in `tests/integration/missing_headers.test.js`
- [x] T034 [P] Protocol version mismatch test in `tests/integration/protocol_mismatch.test.js`
- [x] T035 [P] Session timeout cleanup test in `tests/integration/session_timeout.test.js`
- [x] T036 [P] Multiple initialize attempts test in `tests/integration/multiple_initialize.test.js`

## Phase 3.8: Polish & Validation
- [x] T037 [P] SDK configuration unit tests in `tests/unit/sdk_config.test.js`
- [x] T038 [P] Transport registry unit tests in `tests/unit/sdk_transport_registry.test.js`
- [ ] T039 Execute quickstart.md validation scenarios (all phases) (pending: run quickstart validation scenarios)
- [x] T040 Performance validation: SDK session handling vs custom implementation
- [x] T041 [P] Update AGENTS.md with SDK architecture changes
- [x] T042 [P] Update documentation for SDK-based remote mode
- [ ] T043 Troubleshooting scenarios validation from quickstart.md (pending: validate troubleshooting scenarios end-to-end)
## Dependencies
- Setup (T001-T002) before tests (T003-T017)
- Contract tests (T003-T010) before integration tests (T011-T017)
- All tests before implementation (T018-T032)
- T018 (SDK config) blocks T019, T020, T021
- T020 (remote server) blocks T021 (CLI integration)
- T023-T026 (cleanup) after T018-T021 (new implementation)
- Core implementation before enhanced testing (T033-T036)
- Implementation before validation (T037-T043)

## Parallel Example
```bash
# Launch SDK contract tests together (T003-T010):
Task: "SDK integration contract test in tests/contract/sdk_integration_contract.test.js"
Task: "Backwards compatibility contract test in tests/contract/backwards_compatibility_contract.test.js"
Task: "Transport switching contract test in tests/contract/transport_switching_contract.test.js"
Task: "SDK initialize contract test in tests/contract/sdk_initialize_contract.test.js"
Task: "SDK shutdown contract test in tests/contract/sdk_shutdown_contract.test.js"
Task: "SDK session management test in tests/contract/sdk_session_management_contract.test.js"
Task: "SDK state transitions validation test in tests/contract/sdk_state_transitions_validation.test.js"
Task: "SDK error codes contract test in tests/contract/sdk_error_codes_contract.test.js"

# Launch SDK integration tests together (T011-T017):
Task: "SDK lifecycle integration test in tests/integration/sdk_lifecycle_integration.test.js"
Task: "IDE client compatibility test in tests/integration/ide_client_compatibility_integration.test.js"
Task: "Session cleanup integration test in tests/integration/session_cleanup_integration.test.js"
Task: "SDK tool registration integration test in tests/integration/sdk_tool_registration_integration.test.js"
Task: "Legacy endpoint deprecation test in tests/integration/legacy_endpoint_deprecation_integration.test.js"
Task: "Pre-initialize error handling test in tests/integration/pre_initialize_error_handling_integration.test.js"
Task: "Claude Desktop configuration test in tests/integration/claude_desktop_configuration_integration.test.js"
```
Task: "Transport switching contract test in tests/contract/transport_switching_contract.test.js"
Task: "SDK initialize contract test in tests/contract/sdk_initialize_contract.test.js"
Task: "SDK shutdown contract test in tests/contract/sdk_shutdown_contract.test.js"
Task: "SDK session management test in tests/contract/sdk_session_management_contract.test.js"
Task: "SDK state transitions validation test in tests/contract/sdk_state_transitions_validation.test.js"
Task: "SDK error codes contract test in tests/contract/sdk_error_codes_contract.test.js"

# Launch SDK integration tests together (T012-T018):
Task: "SDK lifecycle integration test in tests/integration/sdk_lifecycle_integration.test.js"
Task: "IDE client compatibility test in tests/integration/ide_client_compatibility_integration.test.js"
Task: "Session cleanup integration test in tests/integration/session_cleanup_integration.test.js"
Task: "SDK tool registration integration test in tests/integration/sdk_tool_registration_integration.test.js"
Task: "Legacy endpoint deprecation test in tests/integration/legacy_endpoint_deprecation_integration.test.js"
Task: "Pre-initialize error handling test in tests/integration/pre_initialize_error_handling_integration.test.js"
Task: "Claude Desktop configuration test in tests/integration/claude_desktop_configuration_integration.test.js"
```

## SDK Migration Strategy
**From Custom → To SDK**:
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
   - Dual transport → T012 SDK lifecycle integration test [P]
   - Error logging enhancement → T024 SDK error logging categorization [P]
   - Constitutional alignment → T033-T034 constitutional compliance validation [P]

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T007, T008, T004, T005)
- [x] All entities have implementation tasks (T019, T020, T021, T022)
- [x] All tests come before implementation (T004-T018 before T019-T034)
- [x] Parallel tasks truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] SDK migration preserves stdio mode compatibility
- [x] Constitutional compliance maintained (single tool, simplicity, TDD)
- [x] All quickstart scenarios covered (T041, T045)
- [x] All error scenarios tested (T011, T017, T035-T038)
- [x] Legacy compatibility maintained (T013, T016, T031)

## Functional Requirements Coverage

**✅ ALL 14 FRs COVERED:**
- FR-001 (initialize handler) → T007 SDK initialize contract test
- FR-002 (shutdown handler) → T008 SDK shutdown contract test
- FR-003 (endpoint consolidation) → T031 Legacy endpoint deprecation
- FR-004 (protocol headers) → T035 Missing headers error test
- FR-005 (remove envelope) → T021 SDK remote server migration
- FR-006 (session state validation) → T010 SDK state transitions test
- FR-007 (capabilities negotiation) → T007 SDK initialize contract test
- FR-008 (JSON-RPC contracts) → T007-T008 initialize/shutdown tests
- FR-009 (session cleanup) → T014 Session cleanup integration test
- FR-010 (IDE config format) → T018 Claude Desktop configuration test
- FR-011 (SDK migration) → T004-T028 (entire SDK migration)
- FR-012 (update AGENTS.md) → T043 Update AGENTS.md
- FR-013 (assess constitution.md) → T033 Constitutional compliance validation
- FR-014 (add governance rule) → T034 Add governance rule to constitution.md
