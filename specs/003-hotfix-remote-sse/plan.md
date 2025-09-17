
# Implementation Plan: Remote SSE MCP Lifecycle Hotfix

**Branch**: `003-hotfix-remote-sse` | **Date**: 2025-09-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/lucas/Projetos/Pessoal/youtube-transcript-mcp/specs/003-hotfix-remote-sse/spec.md`

## Execution **Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete
- [x] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

**Artifacts Generated**:
- [x] `research.md` - SDK migration decisions and rationale for official MCP SDK adoption
- [x] `data-model.md` - SDK-based session state machine and transport entities  
- [x] `contracts/` - JSON Schema contracts for SDK integration validation
- [x] `quickstart.md` - End-to-end SDK integration guide for IDE compatibility

**Execution Flow (/plan command scope)**:
```
1. Load feature spec from Input path ✓
   → Feature spec loaded successfully
2. Fill Technical Context ✓
   → No NEEDS CLARIFICATION detected - SDK migration approach clear
   → Project Type: single (Node.js ESM project)
   → Structure Decision: Option 1 (single project)
3. Fill the Constitution Check section ✓
4. Evaluate Constitution Check section ✓
   → No violations detected - SDK is existing dependency
   → Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md ✓
   → SDK adoption decisions documented
6. Execute Phase 1 → contracts, data-model.md, quickstart.md ✓
   → SDK integration artifacts generated
7. Re-evaluate Constitution Check section ✓
   → No new violations - SDK simplifies architecture
   → Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → SDK migration task approach described ✓
9. STOP - Ready for /tasks command ✓
```

## Summary
Migrate remote SSE server from custom implementation to official `@modelcontextprotocol/typescript-sdk` for full MCP protocol compliance. Replace custom transport layer with `StreamableHTTPServerTransport` for modern clients and `SSEServerTransport` for backwards compatibility. SDK automatically handles initialize/shutdown lifecycle, endpoint consolidation, protocol headers, session management, and error handling, significantly reducing implementation complexity while ensuring standards compliance.

## Technical Context
**Language/Version**: JavaScript ESM (Node.js 18+)  
**Primary Dependencies**: @modelcontextprotocol/typescript-sdk (existing), Native Node.js modules  
**Storage**: SDK-managed session registry with automatic cleanup  
**Testing**: node:test framework with SDK integration and transport validation  
**Target Platform**: Node.js server (Linux/macOS/Windows)  
**Project Type**: single  
**Performance Goals**: SDK-handled concurrent connections, built-in timeout management, automatic heartbeat  
**Constraints**: Maintain stdio mode compatibility, preserve existing tool contracts, leverage SDK for protocol compliance  
**Scale/Scope**: Single server instance, ~5-8 source files affected (reduced via SDK), 6-10 new SDK integration tests  

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **I. Entrega de uma única ferramenta**: Changes extend `transcript_yt` tool experience via improved transport without fragmenting APIs  
✅ **II. Simplicidade operacional**: Uses native Node.js modules, maintains CLI process model, preserves stdio/remote parity  
✅ **III. Testes como gate de qualidade**: All changes will have contract, integration, and unit tests following TDD  
✅ **IV. Observabilidade enxuta**: Maintains categorized logging (`invalid_request`, `tool_error`) with no PII  
✅ **V. Segurança e privacidade pragmáticas**: Respects CORS configuration, maintains timeout controls, no secrets stored  

**Operational Guidelines Check**:
✅ Node.js 18+ support maintained  
✅ No additional dependencies beyond existing @modelcontextprotocol/sdk  
✅ Documentation updates planned (AGENTS.md, constitution.md)  
✅ JSON canonical format preserved  
✅ CLI flag validation maintained  

## Project Structure

### Documentation (this feature)
```
specs/003-hotfix-remote-sse/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── server/
│   ├── remote-server.js         # ← REPLACE with SDK-based implementation
│   ├── message-router.js        # ← REMOVE (SDK handles routing)
│   ├── client-session.js        # ← SIMPLIFY (SDK manages sessions)
│   ├── session-registry.js      # ← REPLACE with SDK transport registry
│   └── event-stream-handler.js  # ← REMOVE (SDK handles SSE)
├── lib/                         # ← No changes needed
└── tool/                        # ← No changes needed

tests/
├── contract/
│   ├── sdk_integration_contract.test.js  # ← NEW: SDK integration contract
│   ├── backwards_compatibility_contract.test.js # ← NEW: Legacy client support
│   └── transport_switching_contract.test.js # ← NEW: Streamable/SSE transport tests
├── integration/
│   ├── sdk_lifecycle_integration.test.js    # ← NEW: Full SDK lifecycle test
│   ├── ide_client_compatibility_integration.test.js # ← NEW: Real IDE client tests
│   └── session_cleanup_integration.test.js  # ← NEW: SDK session cleanup tests
└── unit/
    ├── sdk_config.test.js       # ← NEW: SDK configuration validation
    └── transport_registry.test.js # ← NEW: Transport management tests
```

**Structure Decision**: Option 1 (single project) - existing Node.js ESM structure maintained

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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate SDK migration tasks from Phase 1 design docs
- Each SDK integration point → migration task [P]
- Each legacy component → replacement/removal task [P] 
- Each test scenario → SDK compatibility test task
- Documentation update tasks for new SDK-based architecture

**Ordering Strategy**:
- TDD order: SDK integration tests before implementation 
- Dependency order: SDK setup → transport migration → session management → testing
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md (reduced from custom implementation due to SDK automation)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete
- [x] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/.specify/memory/constitution.md`*
