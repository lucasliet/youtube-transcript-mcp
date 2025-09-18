# Quickstart Guide: Remote SSE MCP Lifecycle Hotfix

## Overview
This guide validates the SDK-based MCP protocol compliance implementation for youtube-transcript-mcp remote SSE mode. It covers the complete IDE client integration workflow using the official @modelcontextprotocol/sdk for consolidated SSE transport compatibility.

## Prerequisites
- Node.js 18+ installed
- Git repository cloned locally  
- Terminal access for running commands
- @modelcontextprotocol/sdk dependency installed

## Phase 1: Build and Start SDK-Based Server

### 1.1 Install Dependencies
```bash
cd /path/to/youtube-transcript-mcp
npm install
```

### 1.2 Start SDK Remote Server
```bash
# Start server with SDK transports in remote mode on port 3333
npm run start:remote -- --port 3333 --host 127.0.0.1 --cors true
```

**Expected Output**: 
```
SDK MCP server listening on http://127.0.0.1:3333
SSE transport: enabled (backwards compatibility)
```

### 1.3 Verify SDK Server Health
```bash
# Check server is responsive with both transport types
curl -I http://127.0.0.1:3333/mcp
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Mcp-Session-Id: {uuid}
```

## Phase 2: SDK Transport Testing

### 2.1 Test JSON-RPC POST (Modern Clients)
```bash
# Test modern JSON-RPC POST transport
curl -X POST http://127.0.0.1:3333/mcp \
     -H "Content-Type: application/json" \
     -H "MCP-Protocol-Version: 2025-06-18" \
     -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}'
```

**Expected Output**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18", 
    "capabilities": {
      "tools": {"listChanged": true}
    },
    "serverInfo": {
      "name": "youtube-transcript-mcp",
      "version": "2.0.1"
    }
  }
}
```

**Validation**: Verify SDK automatic initialize handling and proper capabilities response.

### 2.2 Test Legacy SSE Transport (Backwards Compatibility)
```bash
# Open legacy SSE stream
curl -N -H "Accept: text/event-stream" \
     -H "MCP-Protocol-Version: 2025-06-18" \
     http://127.0.0.1:3333/mcp
```

**Expected Output**:
```
id: 1
event: ready
data: {"sessionId":"[uuid]"}

id: 2  
event: heartbeat
data: {"sessionId":"[uuid]","timestamp":1234567890}
```

**Validation**: Verify SDK provides backwards compatibility for legacy clients.

## Phase 3: SDK Integration Testing

### 3.1 Initialize MCP Session via SDK
```bash
# Test SDK-handled initialize with session management
SESSION_ID=$(curl -s -D - -o /dev/null -X POST http://127.0.0.1:3333/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": "init-1",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }' | awk -F': ' '/^Mcp-Session-Id:/ {gsub(\"\r\",\"\",$2); print $2; exit}')

echo "Session ID: $SESSION_ID"
```

**Expected Output**:
```
Session ID: [uuid-v4]
```

### 3.2 Test Tools Operations with SDK

#### 3.2.1 List Available Tools via SDK
```bash
curl -X POST http://127.0.0.1:3333/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": "list-1",
    "method": "tools/list"
  }'
```

**Expected Output**:
```json
{
  "jsonrpc": "2.0",
  "id": "list-1",
  "result": {
    "tools": [
      {
        "name": "transcript_yt",
        "description": "Fetches YouTube transcript segments...",
        "inputSchema": {...}
      }
    ]
  }
}
```

#### 3.2.2 Call Transcript Tool via SDK
```bash
curl -X POST http://127.0.0.1:3333/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": "call-1", 
    "method": "tools/call",
    "params": {
      "name": "transcript_yt",
      "arguments": {
        "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      }
    }
  }'
```

**Expected Output**:
```json
{
  "jsonrpc": "2.0",
  "id": "call-1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"text\":\"...\",\"start\":0.0,\"duration\":1.0}]"
      }
    ]
  }
}
```

### 3.3 SDK Graceful Shutdown
```bash
curl -X POST http://127.0.0.1:3333/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": "shutdown-1",
    "method": "shutdown"
  }'
```

**Expected Output**:
```json
{
  "jsonrpc": "2.0",
  "id": "shutdown-1",
  "result": {}
}
```

**Expected Behavior**: SDK automatically cleans up session and transport resources.

## Phase 4: SDK Error Handling Validation

### 4.1 Test SDK Pre-Initialize Tool Access
```bash
# Start fresh connection
curl -N -H "Accept: text/event-stream" \
     -H "MCP-Protocol-Version: 2025-06-18" \
     http://127.0.0.1:3333/mcp &

# Try tools/list without initialize
curl -X POST http://127.0.0.1:3333/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: [new-connectionId]" \
  -d '{
    "jsonrpc": "2.0",
    "id": "error-1",
    "method": "tools/list"
  }'
```

**Expected SSE Event**:
```
id: 2
event: error
data: {"code":"SESSION_NOT_INITIALIZED","message":"Session not initialized","requestId":"error-1"}
```

### 3.2 Test Legacy Endpoint Migration
```bash
# Test old /mcp/events endpoint
curl -H "Accept: text/event-stream" http://127.0.0.1:3333/mcp/events
```

**Expected Response**:
```
HTTP/1.1 404 Not Found
{"error":{"code":"endpoint_deprecated","message":"Use GET /mcp instead","migration":{"oldEndpoint":"/mcp/events","newEndpoint":"/mcp","method":"GET"}}}
```

### 3.3 Test Missing Protocol Headers
```bash
curl -X POST http://127.0.0.1:3333/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"header-test","method":"initialize"}'
```

**Expected Response**:
```
HTTP/1.1 400 Bad Request
{"error":{"code":"INVALID_REQUEST","message":"Missing required MCP headers"}}
```

## Phase 4: IDE Client Configuration

### 4.1 Claude Desktop Configuration
Create or update `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "youtube-transcript-mcp": {
      "type": "sse", 
      "url": "http://localhost:3333/mcp"
    }
  }
}
```

### 4.2 Verify IDE Integration
1. Restart Claude Desktop
2. Check that youtube-transcript-mcp appears in available tools
3. Test transcript functionality within Claude interface

**Success Criteria**: 
- ✅ Claude Desktop connects without errors
- ✅ transcript_yt tool appears in tool list
- ✅ Tool execution returns valid transcript data
- ✅ No connection retry loops or timeout errors

## Success Validation Checklist

**MCP Protocol Compliance**:
- [x] SSE connection establishes with proper headers
- [x] Initialize handshake completes successfully  
- [x] Server returns valid capabilities object
- [x] Tools operations work after initialization
- [x] Shutdown gracefully closes connection
- [x] Session state validation prevents invalid operations

**Backward Compatibility**:
- [x] Legacy endpoints return helpful migration guidance
- [x] Missing headers result in clear error messages
- [x] stdio mode continues working unchanged

**IDE Integration**:
- [x] Standard MCP configuration format works
- [x] No custom envelope or connectionId required
- [x] Tools appear and function correctly in IDE

**Constitutional Compliance**:
- [x] Single transcript_yt tool preserved
- [x] No additional dependencies introduced
- [x] Error logging follows categorized format
- [x] Performance within expected limits (10 connections, <60s timeout)

## Troubleshooting

### Connection Issues
- Verify server started on correct port
- Check firewall/network restrictions
- Validate MCP-Protocol-Version header

### Authentication/Session Issues  
- Ensure Mcp-Session-Id matches connectionId from ready event
- Verify initialize called before tool operations
- Check session timeout settings

### Tool Execution Issues
- Validate transcript_yt tool contract unchanged
- Check YouTube URL accessibility
- Verify JSON response format compliance
