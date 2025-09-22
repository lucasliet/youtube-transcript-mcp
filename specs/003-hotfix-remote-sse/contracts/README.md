# SDK MCP Contracts

This directory contains JSON Schema contracts for SDK-based Model Context Protocol compliance validation.

## Contract Files

### SDK Integration Contracts
- `initialize-request.json` - Schema for SDK-handled initialize method request
- `initialize-response.json` - Schema for SDK-handled initialize method response  
- `shutdown-request.json` - Schema for SDK-handled shutdown method request

### SDK Transport Validation
- `streamable-http-config.json` - StreamableHTTPServerTransport configuration schema
- `sse-transport-config.json` - SSEServerTransport configuration schema  
- `transport-registry.json` - Schema for dual transport management

### SDK Session Management
- `session-state.json` - SDK session state validation schema
- `capabilities-negotiation.json` - SDK capabilities exchange schema

## Usage

These contracts are used for:
1. **Contract testing** - Validate request/response conformance
2. **Client validation** - Ensure IDE client compatibility  
3. **Documentation** - Provide precise API specifications
4. **Code generation** - Generate TypeScript interfaces

## Validation

All contracts follow JSON Schema Draft 2020-12 specification and are validated against MCP 2025-06-18 protocol requirements.