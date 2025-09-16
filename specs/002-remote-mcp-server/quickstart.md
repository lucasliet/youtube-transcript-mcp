# Quickstart: Remote MCP Server with SSE Support

## Prerequisites
- Node.js 18+ installed.
- Network access to youtube.com.
- Terminal with `curl` (or any SSE-capable client).

## 1. Install dependencies
```bash
npm install
```

## 2. Start the remote server
```bash
node src/cli.js --mode remote --port 3000 --host 0.0.0.0 --maxClients 10 --heartbeat 25000 --request-timeout 60000
```
The command keeps stdio mode unchanged (default) and switches to remote mode only when `--mode remote` is provided.

## 3. Establish an SSE connection
In a new terminal, request the event stream. The server replies with a `ready` event containing the generated `connectionId` and available endpoints.
```bash
curl -N http://localhost:3000/mcp/events
```
Sample initial event:
```
event: ready
data: {"connectionId":"c5fdb2c8-8a3d-4ef9-87c9-2aa7e8f9971e","messageEndpoint":"/mcp/messages"}
```
Keep this terminal open; it receives all responses.

## 4. Send a transcript request
Use the reported `connectionId` to post an MCP `tools/call` request.
```bash
curl -X POST http://localhost:3000/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "c5fdb2c8-8a3d-4ef9-87c9-2aa7e8f9971e",
    "message": {
      "jsonrpc": "2.0",
      "id": "req-1",
      "method": "tools/call",
      "params": {
        "name": "transcript_yt",
        "arguments": {
          "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "preferredLanguages": ["en"]
        }
      }
    }
  }'
```

## 5. Read the response event
The SSE terminal receives a `message` event containing the JSON-RPC response (result or error). Example success payload:
```
event: message
data: {"connectionId":"c5fdb2c8-8a3d-4ef9-87c9-2aa7e8f9971e","requestId":"req-1","response":{"jsonrpc":"2.0","id":"req-1","result":{"content":[{"type":"text","text":"{\"segments\":[...]"}]}}}
```
If the request fails, the stream emits an `error` event with `{ code, message, details }`.

## 6. Close the session
Terminate the SSE client or wait for the server timeout. The server cleans up the session automatically and logs a single summary line.
