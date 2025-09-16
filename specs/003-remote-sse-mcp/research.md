# Research Findings — Remote MCP Lifecycle Compatibility

## Lifecycle Handshake
- **Decision**: Exigir `initialize` antes de quaisquer chamadas de ferramenta.
- **Rationale**: Clientes MCP em IDEs validam capacidades antes de habilitar comandos; sem resposta ao `initialize` eles aguardam indefinidamente.
- **Alternatives considered**: Permitir `tools/list` implícito; rejeitado porque viola a especificação MCP e gera estados inconsistentes.

## Session State Management
- **Decision**: Manter estado por sessão (`pending`, `ready`, `shutdown`) dentro de `ClientSession`.
- **Rationale**: Garantia de isolamento para múltiplos clientes compartilhando o servidor.
- **Alternatives considered**: Flag global de inicialização; rejeitado porque um cliente afetaria os demais.

## Shutdown & Exit Behaviour
- **Decision**: Responder `shutdown` com `{ "result": null }`, limpar requisições ativas e bloquear novas chamadas até novo `initialize`; `exit` encerra SSE e heartbeat.
- **Rationale**: Imita comportamento stdio e evita conexões zumbis.
- **Alternatives considered**: Ignorar `exit`; rejeitado pois deixaria timers ativos e uso de recursos sem necessidade.

## Documentation & Tooling
- **Decision**: Atualizar README/quickstart para enfatizar handshake completo.
- **Rationale**: Sem instruções explícitas, IDEs seguem tentando chamadas e recebem erros genéricos, dificultando diagnóstico.
- **Alternatives considered**: Somente comentários em código; rejeitado por baixa visibilidade.
