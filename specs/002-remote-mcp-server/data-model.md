# Data Model: Remote MCP Server with SSE Support

## Overview
Logical entities backing the remote MCP mode. Structures remain in-memory and reuse existing transcript tool contracts.

## Core Entities

### 1. ServerConfig
**Purpose**: Describes runtime configuration for stdio or remote mode.

**Fields**:
- `mode`: `'stdio' | 'remote'`
- `port`: number (default 3000)
- `host`: string (default `0.0.0.0`)
- `cors`: string | `false` (allowed origin or disabled)
- `heartbeatIntervalMs`: number (default 25000)
- `requestTimeoutMs`: number (default 60000)
- `maxClients`: number (default 10)

**Validation Rules**:
- `mode` must be one of the supported literals.
- `port` between 1 and 65535.
- `heartbeatIntervalMs` and `requestTimeoutMs` positive integers with timeout > heartbeat.
- `maxClients` positive integer.

### 2. ClientSession
**Purpose**: Tracks an open SSE channel and its metadata.

**Fields**:
- `connectionId`: string (UUID v4)
- `response`: ServerResponse (Node stream for SSE writes)
- `lastActivity`: number (epoch ms)
- `pendingRequests`: Map<string, RequestState>
- `heartbeatTimer`: Timeout | null
- `closed`: boolean

**Validation Rules**:
- `connectionId` unique across active sessions.
- `pendingRequests` count limited to 1 to satisfy single-request-per-client guarantee.
- `closed` toggles once stream ends to avoid duplicate cleanup.

### 3. RequestState
**Purpose**: Represents transcript work triggered by a client.

**Fields**:
- `requestId`: string (mirrors JSON-RPC id)
- `receivedAt`: number (epoch ms)
- `method`: string (`tools/list` or `tools/call`)
- `payload`: object (original JSON-RPC params)
- `abortController`: AbortController (cancels fetch if timeout fires)

**Validation Rules**:
- Only one active RequestState per `ClientSession`.
- `method` must be whitelisted; reject others before persistence.
- Timeout closes RequestState and publishes error event.

### 4. OutboundEvent
**Purpose**: Envelope for SSE messages dispatched to a client.

**Fields**:
- `event`: `'ready' | 'message' | 'error' | 'heartbeat'`
- `connectionId`: string
- `requestId`: string | null
- `data`: object (JSON serialised before sending)
- `id`: string (monotonic event id per session)
- `sentAt`: number (epoch ms)

**Validation Rules**:
- `id` increments per client to aid EventSource recovery.
- `requestId` required for `message` and `error` when originating from a request.
- `data` must stay JSON-serialisable.

### 5. ErrorFrame
**Purpose**: Standardises error payloads shared by SSE and HTTP responses.

**Fields**:
- `code`: string (e.g., `invalid_request`, `tool_error`, `timeout`, `server_error`)
- `message`: string
- `details`: object | null (extended context)

**Validation Rules**:
- `code` pulled from controlled list; fallback to `server_error`.
- `message` human-readable but concise.

## Relationships
```
ServerConfig (1) ── manages ──> ClientSession (N)
ClientSession (1) ── owns ──> RequestState (0..1)
RequestState (1) ── outputs ──> OutboundEvent (>=1)
OutboundEvent (N) ── may embed ──> ErrorFrame (0..1)
```

## Data Flow
1. **Handshake**: HTTP GET `/mcp/events` opens SSE stream. Server allocates `ClientSession`, emits `ready` event with `connectionId` and meta.
2. **Inbound Request**: Client POSTs to `/mcp/messages` using assigned `connectionId`. Server creates `RequestState`, validates payload, triggers MCP handler.
3. **Response Delivery**: Successful completion serialises MCP response into `OutboundEvent` `message`. Errors produce `error` events containing `ErrorFrame`.
4. **Heartbeat & Timeout**: Timer emits `heartbeat` events periodically; idle sessions exceeding `requestTimeoutMs` close and free resources.
5. **Cleanup**: Client disconnect or timeout marks `ClientSession.closed`, clears pending request, and removes SSE stream reference.

## Persistence Strategy
- Entire model is in-memory; restart drops active sessions (clients must reconnect).
- No database or disk state required.
- CLI flags configure runtime; environment variables optional wrapper around them.

## Backward Compatibility
- Stdio mode retains existing behaviour; no changes to transcript tool schema.
- Remote mode reuses the same MCP tool name and parameters.
- Error codes align with stdio logging categories for compatibility with existing clients.
