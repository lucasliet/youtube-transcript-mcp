# Quickstart — Remote MCP Lifecycle with SSE

## 1. Start the server
```
node src/cli.js --mode remote --port 3333 --host 0.0.0.0 --cors "*"
```

## 2. Open the SSE stream
```
curl -N http://localhost:3333/mcp/events
```
Guarde o `connectionId` informado no evento `ready`.

## 3. Initialize the session
```
curl -X POST http://localhost:3333/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "<CONNECTION_ID>",
    "message": {
      "jsonrpc": "2.0",
      "id": "init-1",
      "method": "initialize",
      "params": {
        "clientInfo": { "name": "VSCode", "version": "1.0" }
      }
    }
  }'
```
O terminal do SSE recebe `event: message` com `capabilities` e `serverInfo`.

## 4. Call tools
Continue usando o mesmo `connectionId` para `tools/list` e `tools/call`.

## 5. Shutdown and exit
1. Envie `shutdown`:
```
curl -X POST http://localhost:3333/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "<CONNECTION_ID>",
    "message": {
      "jsonrpc": "2.0",
      "id": "close-1",
      "method": "shutdown",
      "params": null
    }
  }'
```
2. Envie `exit` para encerrar a sessão:
```
curl -X POST http://localhost:3333/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "<CONNECTION_ID>",
    "message": {
      "jsonrpc": "2.0",
      "id": "close-2",
      "method": "exit",
      "params": null
    }
  }'
```
O stream é finalizado; novos pedidos exigem repetir o `initialize`.
