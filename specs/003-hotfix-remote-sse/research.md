# Research: Remote SSE MCP Lifecycle Hotfix

## SDK Migration Research

### Decision: Adopt Official @modelcontextprotocol/sdk
**Rationale**: Research confirmed SDK provides complete MCP protocol compliance with built-in session management, transport layer, and backwards compatibility. Eliminates 200+ lines of custom code while ensuring standards compliance and automatic protocol updates.

**Key SDK Benefits**:
- StreamableHTTPServerTransport: Modern MCP protocol (2025-03-26) 
- SSEServerTransport: Legacy support (2025-06-18)
- Automatic initialize/shutdown lifecycle handling
- Built-in session management with UUID generation
- Standards-compliant error handling and JSON-RPC processing
- CORS and header management included

**Alternatives considered**:
- Custom MCP implementation: Rejected - 7 critical compliance gaps identified, maintenance burden
- Hybrid approach (SDK + custom): Rejected - violates simplicity principle, creates integration complexity
- Alternative MCP libraries: Rejected - official SDK is most mature and maintained

### Decision: Dual Transport Strategy for Backwards Compatibility
**Rationale**: SDK supports both modern StreamableHTTP and legacy SSE transports simultaneously, enabling gradual client migration while maintaining IDE compatibility.

**Implementation approach**:
- Primary: StreamableHTTPServerTransport for modern IDE clients
- Secondary: SSEServerTransport for legacy client compatibility  
- Single `/mcp` endpoint handling both transport types via SDK

**Alternatives considered**:
- StreamableHTTP only: Rejected - breaks existing legacy clients
- SSE only: Rejected - doesn't utilize modern protocol improvements
- Separate endpoints: Rejected - SDK consolidates to single endpoint pattern

## Node.js Implementation Patterns

### Decision: SDK Integration Testing with Contract Validation
**Rationale**: Focus testing on SDK integration points and backwards compatibility rather than reimplementing MCP protocol tests. SDK handles protocol compliance, tests verify integration correctness and configuration.

**Testing layers**:
- SDK transport configuration validation
- Tool registration and capability negotiation via SDK
- Legacy client compatibility with SSE transport
- Modern client compatibility with StreamableHTTP transport
- Session cleanup and lifecycle management via SDK

**Alternatives considered**:
- Manual protocol implementation: Rejected - SDK eliminates need for custom protocol handling
- End-to-end testing only: Rejected - insufficient for SDK integration validation
- Mock-based testing: Rejected - must validate against real MCP client behavior and SDK transport layer

### Decision: SDK-Focused Test Coverage  
**Rationale**: Test SDK configuration, transport setup, and integration points rather than duplicating SDK's internal protocol tests. Ensures proper tool registration and client compatibility.

**Key test areas**:
- SDK transport initialization and configuration
- Tool registration via SDK McpServer.registerTool()
- Client connection lifecycle via both transport types
- Session management and cleanup via SDK handlers
- Backwards compatibility with existing stdio mode (unchanged)

**Alternatives considered**:
- Full protocol reimplementation testing: Rejected - SDK handles protocol compliance internally
- stdio deprecation testing: Rejected - violates constitutional single-tool principle
- Combined mode testing only: Rejected - insufficient coverage of transport-specific behavior

## Constitutional Alignment Research

### Decision: Preserve Single Tool Focus
**Rationale**: Migration to SDK maintains exclusive focus on `transcript_yt` tool while improving MCP client accessibility. No new tool functionality added, only improved protocol compliance via SDK.

### Decision: Leverage Existing SDK Dependency
**Rationale**: @modelcontextprotocol/sdk already exists in project dependencies. SDK migration reduces custom code complexity while maintaining constitutional principle of minimal dependencies.

### Decision: Categorized Error Logging Enhancement  
**Rationale**: Extend existing `invalid_request`, `tool_error` categories with MCP-specific error types while maintaining constitutional logging principles.

**Alternatives considered**:
- Verbose MCP debugging: Rejected - violates observability simplicity
- Silent error handling: Rejected - reduces operational visibility
- External monitoring integration: Rejected - beyond constitutional scope