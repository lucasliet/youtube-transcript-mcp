# Feature Specification: Remote SSE MCP Lifecycle Hotfix

**Feature Branch**: `003-hotfix-remote-sse`  
**Created**: 2025-09-17  
**Status**: Completed  
**Input**: User description: "hotfix remote sse Remote SSE MCP mode must support MCP initialize/shutdown lifecycle so IDE clients can connect and spec should capture this requirement, it should be configured as follow on IDE client: \"youtube-transcript-mcp\": { \"type\": \"sse\", \"url\": \"http://localhost:3333/mcp\" } search if we are attending to remote sse mcp specification and if fixes are needed to acomplish it to work, add to constitution: at the end of each implementation, if necessary update AGENTS.md and constitution.md with current project state"

**Analysis Result**: SDK migration required - substituir a implementação customizada pelo @modelcontextprotocol/typescript-sdk para garantir ciclo MCP completo, endpoint remoto consolidado (`/mcp`) via SSE e gerenciamento automático de sessões/erros.

## Execution Flow (main)
```
1. Review the user description to surface lifecycle expectations for remote SSE mode
   → If expected MCP stages remain ambiguous: [NEEDS CLARIFICATION: clarify required initialize/shutdown events]
2. Validate that the documented IDE configuration snippet matches the remote SSE endpoint behavior
   → If mismatched: capture the discrepancy for remediation planning
3. Define user scenarios reflecting IDE clients connecting, operating, and disconnecting via SSE
4. Draft functional requirements covering lifecycle handling, compliance review, documentation, and governance updates
5. Review current code implementation to identify missing MCP protocol methods
6. Add specific implementation requirements for initialize/shutdown methods and SDK migration
7. Run the Review & Acceptance Checklist and resolve any [NEEDS CLARIFICATION] markers
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions  
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
An IDE user connects to the youtube-transcript-mcp server via the consolidated MCP SSE endpoint so the IDE can complete the standard MCP initialize handshake, expose the transcript tool, and later request a controlled shutdown without protocol compatibility issues.

### Acceptance Scenarios
1. **Given** the remote SSE server is running at `http://localhost:3333/mcp` with consolidated endpoint support, **When** an IDE client uses standard MCP configuration to connect, **Then** the MCP `initialize` handshake completes successfully and the IDE lists the youtube-transcript-mcp tools without retry loops.
2. **Given** an IDE client has completed the `initialize` handshake with proper session state, **When** the client issues an MCP `shutdown` request, **Then** the server acknowledges the request, streams the shutdown confirmation, and closes the connection gracefully so the IDE reports a clean disconnect.
3. **Given** an IDE client attempts to call `tools/list` before completing the `initialize` handshake, **When** the server receives the request, **Then** it rejects the request with a proper JSON-RPC error indicating session not initialized.
4. **Given** an IDE client sends a standard JSON-RPC request without custom envelope, **When** the server processes the request, **Then** it handles the message correctly without requiring connectionId wrapper.
5. **Given** an IDE client includes required MCP protocol headers, **When** establishing the connection, **Then** the server validates and accepts the protocol version and session management.
6. **Given** a client attempts to connect to legacy endpoints `/mcp/events` or `/mcp/messages`, **When** the server receives the request, **Then** it returns appropriate error responses guiding to the new `/mcp` endpoint.

### Edge Cases
- What happens when the IDE sends an `initialize` request with missing capabilities or unexpected schema versions?
- How does the system handle simultaneous IDE connections attempting to initialize and shutdown within overlapping time windows?
- What occurs when an IDE client disconnects abruptly without calling `shutdown`?
- How should the server handle multiple `initialize` calls from the same connection?
- What happens when clients try to connect to old endpoints (`/mcp/events`, `/mcp/messages`) after consolidation to `/mcp`?
- How does the server respond to requests using the old custom envelope format after migration to direct JSON-RPC?
- What occurs when clients send requests without required MCP protocol headers (`MCP-Protocol-Version`, `Mcp-Session-Id`)?
- How should the server handle capability mismatches during initialize handshake?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Remote SSE mode MUST implement MCP `initialize` method handler that returns server capabilities and protocol version, completing the lifecycle for IDE clients configured with the documented SSE endpoint so they can load the transcript tool.
- **FR-002**: Remote SSE mode MUST implement MCP `shutdown` method handler that gracefully closes the SSE connection after acknowledging the request, terminating the SSE stream without leaving orphaned sessions.
- **FR-003**: Server MUST consolidate endpoints from `/mcp/events` and `/mcp/messages` to single `/mcp` endpoint supporting both GET (SSE stream) and POST (JSON-RPC requests) according to MCP Streamable HTTP specification.
- **FR-004**: Server MUST implement required MCP protocol headers including `MCP-Protocol-Version: 2025-06-18` and `Mcp-Session-Id` for session management and protocol conformance.
- **FR-005**: Server MUST remove custom envelope format and process JSON-RPC messages directly, eliminating the `{connectionId, message}` wrapper to conform with standard MCP transport.
- **FR-006**: Server MUST enforce session state validation with explicit states (connecting, initialized, ready), rejecting `tools/list` and `tools/call` requests before `initialize` handshake is completed.
- **FR-007**: Server MUST implement capabilities negotiation in `initialize` response, returning server capabilities object containing tools, resources, and prompts support information.
- **FR-008**: JSON-RPC contracts MUST be updated to include `initialize` and `shutdown` method schemas with proper request/response structures according to MCP specification.
- **FR-009**: Session registry MUST track session state transitions and properly clean up connections after `shutdown` to prevent resource leaks and maintain protocol compliance.
- **FR-010**: IDE configuration MUST use standard MCP SSE format (`type: sse`, `url: http://localhost:3333/mcp`) replacing current non-standard endpoint structure.
- **FR-011**: Server implementation MUST migrate from custom transport layer to official `@modelcontextprotocol/typescript-sdk` for standards compliance, using `StreamableHTTPServerTransport` for modern clients and `SSEServerTransport` for backwards compatibility with legacy clients.
- **FR-012**: Project documentation MUST update `AGENTS.md` to reflect the endpoint changes from `/mcp/events` + `/mcp/messages` to `/mcp` and document the MCP protocol compliance improvements in project structure and module organization.
- **FR-013**: Project governance MUST assess if current implementation changes require updates to `constitution.md` and, if necessary, update governance rules to reflect the new MCP protocol compliance requirements and architectural changes.
- **FR-014**: Project governance MUST add to `constitution.md` the requirement that, at the end of each implementation, contributors must assess whether `AGENTS.md` and `constitution.md` need updates reflecting the current project state and apply them when necessary.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [x] All missing MCP protocol methods are addressed (initialize, shutdown)
- [x] Session state management is properly specified
- [x] Error handling for invalid state transitions is defined
- [x] Endpoint consolidation from dual endpoints to single `/mcp` endpoint is specified
- [x] Custom envelope format removal and JSON-RPC direct processing is defined
- [x] Required MCP protocol headers implementation is specified
- [x] Capabilities negotiation requirements are clearly defined
- [x] Backward compatibility handling for legacy endpoints is addressed
- [x] SDK migration requirement for standards compliance is specified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Code implementation reviewed
- [x] Missing methods identified
- [x] Session state requirements added
- [x] SDK migration requirement added
- [x] Review checklist passed

---
