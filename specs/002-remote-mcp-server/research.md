# Research: Remote MCP Server with SSE Support

## Transport & Protocol
**Decision**: Implement the remote mode with the Node.js `http` module exposing `GET /mcp/events` as the SSE endpoint.
**Rationale**:
- Native HTTP keeps the binary dependency-free and matches the existing stdio runtime.
- SSE fits MCP's server-to-client streaming pattern and is widely supported by hosting platforms.
- A single endpoint simplifies deployment and can multiplex multiple clients via unique connection identifiers.
**Alternatives considered**:
- Express.js or Fastify: unnecessary abstraction for two endpoints and increases cold-start time.
- WebSocket transport: more complex handshake and framing without delivering extra value for one-way streaming.
- Long polling: wasteful for transcript streaming and complicates connection lifecycle management.

## Inbound Message Flow
**Decision**: Accept JSON-RPC requests through `POST /mcp/messages` with payload `{ connectionId, message }` where `message` follows MCP JSON-RPC framing.
**Rationale**:
- Explicit connection binding prevents cross-client interference.
- HTTP POST keeps firewalls and serverless platforms compatible with outbound-only SSE.
- Reuses the existing MCP handler surface (`tools/list`, `tools/call`) without protocol changes.
**Alternatives considered**:
- Embedding commands as SSE `client-event`: SSE is server-only; clients cannot push data.
- Dedicated per-client endpoints: complicates routing and scaling.
- Webhooks per request: adds latency and coordination complexity.

## Mode Configuration
**Decision**: Introduce `--mode` CLI flag with `stdio` (default) and `remote`; add `--port`, `--host`, `--cors`, `--heartbeat`, and `--request-timeout` options for remote mode.
**Rationale**:
- Single binary supports both transport modes keeping distribution simple.
- Explicit configuration avoids environment-variable coupling and clarifies runtime behaviour.
- Heartbeat and timeout controls allow operators to tune for their hosting constraints.
**Alternatives considered**:
- Separate binaries for stdio and remote: duplicates code and documentation.
- Configuration file: overkill for the minimal option set.
- Implicit remote mode when port provided: less explicit, could surprise users.

## Session Management
**Decision**: Track sessions in memory as `ClientSession` entries keyed by `connectionId` with last-activity timestamps and pending request counters.
**Rationale**:
- Transcript operations are stateless, so in-memory tracking is sufficient.
- Enables enforcement of `maxClients` and graceful cleanup on disconnect or timeout.
- Supports independent request queues per client and isolates failures.
**Alternatives considered**:
- Global queue for all clients: harder to attribute responses and throttling.
- Persistent session store: unnecessary complexity for short-lived connections.
- Stateless processing without sessions: would not allow routing responses back to the right SSE stream.

## Response & Event Model
**Decision**: Emit SSE frames with `event` values `ready`, `message`, `error`, and `heartbeat`; `data` is JSON encoded and includes the originating `connectionId` and optional `requestId`.
**Rationale**:
- `ready` communicates the assigned connection identifier and HTTP endpoints after handshake.
- `message` wraps MCP responses so clients can route them directly back into their runtime.
- `error` harmonises transport-level and application-level failures with structured codes.
- `heartbeat` keeps connections alive behind load balancers and gives clients liveness signals.
**Alternatives considered**:
- Separate SSE stream per event type: multiplies endpoints without benefits.
- Omitting heartbeats: risks idle connections being culled silently.
- Plain-text payloads: harder for clients to parse reliably and extend.

## Error Handling & Observability
**Decision**: Return HTTP 4xx/5xx for setup failures; send SSE `error` events with `{ code, message, data }`; log with categorical tags reused from stdio mode.
**Rationale**:
- Provides immediate feedback when clients misconfigure requests (e.g., missing connectionId).
- Reuses the existing error taxonomy so downstream tooling stays consistent.
- Structured logs keep production diagnostics lightweight but actionable.
**Alternatives considered**:
- Swallow protocol errors and rely on timeouts: hurts debuggability.
- Introduce new error codes: increases cognitive load without new failure classes.
- Verbose logging by default: contradicts spec requirement for minimal logs.

## Security & Deployment
**Decision**: Ship without authentication but support optional `--cors` origins and document deployment behind reverse proxies for TLS.
**Rationale**:
- Feature spec mandates open access; CORS toggle is enough for browser-based clients.
- Operators can front the service with existing TLS termination or API gateways without code changes.
- Keeps initial release frictionless while leaving room for future auth layers.
**Alternatives considered**:
- API keys or JWT: adds storage and rotation effort not requested by spec.
- IP allowlists: brittle for cloud-hosted agents.
- Mandatory TLS termination inside the process: complicates local development.

## Performance & Scalability
**Decision**: Cap concurrent clients with `maxClients` (default 10), queue at most one active transcript request per client, and apply a default request timeout (e.g., 60s).
**Rationale**:
- Prevents a single user from exhausting resources while maintaining predictable behaviour.
- Aligns with YouTube fetch latency expectations and avoids orphaned jobs.
- Keeps the remote server responsive under moderate concurrency without multi-process scaling yet.
**Alternatives considered**:
- Unlimited concurrency: risk of resource exhaustion.
- Dedicated worker threads: premature for I/O-bound workload.
- External job queue: unnecessary overhead for synchronous transcript retrieval.
