# Research: YouTube Transcript MCP Tool

## Decisions
- Sem cache interno: garante simplicidade e evita inconsistência (Spec FR-023/atualização)
- Sem truncamento: consumidor controla (Spec FR-022 substituída pela nova definição de não truncar)
- Logging categorizado: invalid_url, no_captions, inaccessible, network_error, other_error
- Fallback idioma: comparação case-insensitive + prefixo
- Parser XML: regex-based mínimo (sem dependências)
- Test framework: node:test nativo (sem Jest)
- MCP server: @modelcontextprotocol/sdk; handlers usando ListToolsRequestSchema e CallToolRequestSchema; content type retornado: text
- Distribuição: npx via GitHub (branch main); sem build; JavaScript ESM puro
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
| fast-xml-parser | Dependência desnecessária; regex atende aos formatos suportados |

## Open Items Resolved
- NEEDS CLARIFICATION removidos na spec foram consolidados nas decisões acima

## Finalization Criteria
- Todas as ambiguidades tratadas
- Decisões documentadas com justificativa
- Nenhuma dependência não essencial adicionada
