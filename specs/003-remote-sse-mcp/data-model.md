# Data Model — Remote MCP Lifecycle Compatibility

## LifecycleSession
- **Attributes**: `connectionId`, `status` (`pending`, `ready`, `shutdown`), `activeRequest`, `heartbeatTimer`.
- **Behaviours**: `markInitialized()`, `canAcceptRequest(method)`, `markShutdown()`, `completeRequest()`, `close()`.
- **Constraints**: Apenas uma requisição ativa por sessão; métodos `tools/*` requerem status `ready`.

## LifecycleMessage
- **Fields**: `jsonrpc`, `id`, `method`, `params`.
- **Valid Methods**: `initialize`, `shutdown`, `exit`, `tools/list`, `tools/call`.
- **Validation Rules**: `jsonrpc` deve ser `"2.0"`; `method` string não vazia; `params` objeto ou `null`.

## ErrorFrame
- **Description**: Reuso do formato existente `{ code, message, details }`.
- **Extensions**: Garantir código `invalid_request` para chamadas fora de ordem, `timeout` para requisições expiradas.

## SessionRegistry
- **Responsibilities**: Criar, armazenar e remover `LifecycleSession` correlacionada a respostas SSE.
- **Invariants**: Remove sessão em `exit`, timeout ou fechamento da conexão; respeita limite `maxClients`.
