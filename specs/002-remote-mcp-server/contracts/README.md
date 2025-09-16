# API Contracts: Remote MCP Server with SSE Support

## Files
- `sse-connection.json` – handshake and SSE frame schema for `GET /mcp/events`.
- `message-envelope.json` – HTTP POST payload accepted by `/mcp/messages`.
- `mcp-request-response.json` – JSON-RPC requests and responses forwarded to the transcript tool.
- `error-event.json` – Structured payload emitted for SSE `error` events and HTTP failures.

## Contract Testing Goals
- Validate SSE responses set required headers and event structure.
- Ensure inbound JSON-RPC payloads are validated before invoking handlers.
- Confirm error payloads stay consistent between HTTP and SSE transports.
- Verify the transcript tool schema matches remote and stdio usage.
