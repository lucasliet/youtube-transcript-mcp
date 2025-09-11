# Research: YouTube Transcript MCP Tool

## Decisions
- Sem cache interno: garante simplicidade e evita inconsistência (Spec FR-023/atualização)
- Sem truncamento: consumidor controla (Spec FR-022 substituída pela nova definição de não truncar)
- Logging categorizado: invalid_url, no_captions, inaccessible, network_error, other_error
- Fallback idioma: comparação case-insensitive + prefixo
- Parser XML: fast-xml-parser adequado por simplicidade
- Test framework: usar node:test nativo para zero dependências adicionais (reduz complexidade) em vez de Jest
- Versionamento: iniciar em 0.1.0; incremento semântica manual

## Rationale
- Simplicidade: reduz superfície de bugs e manutenção
- Transparência: manter comportamento previsível para LLM
- Portabilidade: evitar dependências pesadas facilita uso via npx

## Alternatives Considered
| Alternativa | Razão Rejeição |
|-------------|----------------|
| Cache in-memory | Pode introduzir inconsistências e estado inesperado em ambiente MCP efêmero |
| Uso de Jest | Dependência adicional não estritamente necessária |
| Truncar longas transcrições | Viola requisito de retorno completo definido na spec |
| Normalização avançada (HTML entities) | Aumenta complexidade sem requisito explícito |
| Suporte múltiplos parsers XML | Desnecessário, fast-xml-parser atende |

## Open Items Resolved
- NEEDS CLARIFICATION removidos na spec foram consolidados nas decisões acima

## Finalization Criteria
- Todas as ambiguidades tratadas
- Decisões documentadas com justificativa
- Nenhuma dependência não essencial adicionada
