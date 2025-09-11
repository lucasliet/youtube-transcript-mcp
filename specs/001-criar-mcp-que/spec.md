# Feature Specification: YouTube Transcript MCP Tool

**Feature Branch**: `001-criar-mcp-que`  
**Created**: 2025-09-11  
**Status**: Draft  
**Input**: User description: "criar mcp que consiga pegar as legendas de um vídeo do youtube com seus timestamps e prover pra LLM pra ela conseguir saber do que o vídeo se trata, tem um exemplo de código para essa implementação em @example.ts, que pode ser usado como analise de requisitos para que o mcp funcione, ele deve agir da mesma forma que esse exemplo de código, o projeto devera ser utilizado com npx na configuração do mcp com o agente"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors (Usuário / Agente LLM), actions (solicitar transcrição), data (URL vídeo, idiomas preferidos, segmentos), constraints (uso via npx, equivalência funcional ao exemplo)
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something, mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Um usuário (ou agente LLM configurado via npx) fornece a URL de um vídeo do YouTube e opcionalmente uma lista ordenada de idiomas preferidos. O sistema retorna a transcrição textual segmentada com timestamps para que a LLM possa compreender o conteúdo e responder perguntas sobre o vídeo.

### Acceptance Scenarios
1. **Given** uma URL válida de vídeo com legendas manuais disponíveis, **When** o usuário solicita a transcrição, **Then** o sistema retorna a lista de segmentos com texto e timestamps em milissegundos.
2. **Given** uma URL válida de vídeo com múltiplos idiomas e lista de idiomas preferidos, **When** a transcrição é solicitada, **Then** o sistema escolhe o primeiro idioma disponível na ordem de preferência e retorna os segmentos.
3. **Given** uma URL válida sem legendas manuais porém com legenda automática, **When** a transcrição é solicitada, **Then** o sistema retorna os segmentos da legenda automática.
4. **Given** uma URL inválida, **When** a transcrição é solicitada, **Then** o sistema retorna indicação de falha sem quebrar a execução (null/erro controlado) e nenhuma lista de segmentos.
5. **Given** um vídeo sem qualquer legenda disponível, **When** a transcrição é solicitada, **Then** o sistema informa ausência de legendas e não retorna segmentos.
6. **Given** um vídeo restrito por idade ou indisponível, **When** a transcrição é solicitada, **Then** o sistema sinaliza estado não acessível de modo controlado.
7. **Given** idiomas preferidos não disponíveis, **When** a transcrição é solicitada, **Then** o sistema aplica fallback para outro idioma existente seguindo regras definidas.
8. **Given** uma chamada repetida para o mesmo vídeo, **When** a transcrição é solicitada novamente, **Then** o sistema realiza uma nova obtenção sem cache interno; qualquer caching é responsabilidade do host/agente (fora do escopo do MCP).

### Edge Cases
- URL com parâmetros adicionais (playlist, timestamp inicial) deve ainda extrair o vídeo corretamente.
- Video ID inexistente retorna falha controlada.
- Ausência de conexão ou timeout de rede deve produzir erro controlado e não travar o agente.
- Legendas contendo formatação ou caracteres especiais devem ser normalizadas preservando conteúdo textual.
- Vídeos extremamente longos: o MCP não trunca respostas; retorna a transcrição completa. Paginação/truncamento, se necessário, deve ser feito pelo consumidor (host/LLM).
- Solicitação simultânea de múltiplos vídeos: sem metas de throughput específicas; deve suportar chamadas concorrentes independentes e sem estado. Ordenação/filas são responsabilidade do host.
- Preferências de idioma com variantes regionais (pt-BR vs pt): matching por igualdade case-insensitive ou prefixo (ex.: "pt" casa "pt-BR").
- Privacidade: não armazenar transcrições de forma persistente. Processamento apenas em memória; logs apenas de metadados operacionais mínimos.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: O sistema DEVE aceitar como entrada uma URL completa de vídeo do YouTube.
- **FR-002**: O sistema DEVE validar se a URL contém um identificador de vídeo extraível.
- **FR-003**: O sistema DEVE retornar uma lista ordenada de segmentos com texto, timestamp inicial em milissegundos e duração.
- **FR-004**: O sistema DEVE permitir lista opcional de idiomas preferidos ordenada por prioridade.
- **FR-005**: O sistema DEVE selecionar a legenda com base na prioridade: (1) manual + idioma preferido, (2) automática + idioma preferido, (3) legenda padrão do vídeo, (4) primeira legenda disponível.
- **FR-006**: O sistema DEVE realizar fallback para qualquer legenda disponível quando nenhuma preferência corresponder.
- **FR-007**: O sistema DEVE distinguir ausência de legendas de falhas de rede e reportar adequadamente.
- **FR-008**: O sistema DEVE retornar indicação clara (ex: null) em caso de URL inválida ou vídeo inacessível.
- **FR-009**: O sistema DEVE tratar erros de acesso (ex: vídeo indisponível, restrição de idade) sem propagação de exceções não tratadas.
- **FR-010**: O sistema DEVE suportar vídeos com legendas automáticas quando legendas manuais não existirem.
- **FR-011**: O sistema DEVE normalizar o texto de cada segmento removendo espaços supérfluos nas extremidades sem alterar conteúdo.
- **FR-012**: O sistema DEVE preservar a ordem temporal dos segmentos.
- **FR-013**: O sistema DEVE permitir utilização via execução npx integrando com o agente MCP conforme fluxo esperado (invocação de ferramenta por nome).
- **FR-014**: O sistema DEVE operar de forma funcionalmente equivalente ao comportamento observado no exemplo fornecido (escopo funcional, não detalhes de implementação).
- **FR-015**: O sistema DEVE registrar falhas não sensíveis de forma que facilite depuração (mensagens genéricas) sem expor dados sensíveis.
- **FR-016**: O sistema DEVE retornar apenas dados necessários (segmentos) sem incluir metadados irrelevantes.
- **FR-017**: O sistema DEVE suportar múltiplos idiomas de legendas (ex: pt-BR, en, es) conforme disponibilizados.
- **FR-018**: O sistema DEVE indicar claramente quando nenhuma legenda foi encontrada.
- **FR-019**: O sistema DEVE lidar com caracteres especiais e acentuação preservando-os no texto final.
- **FR-020**: O sistema DEVE evitar duplicação de segmentos.
- **FR-021**: O sistema DEVE garantir que timestamps estejam em milissegundos inteiros.
- **FR-022**: O sistema NÃO DEVE truncar a transcrição internamente; retorna a transcrição completa. Qualquer truncamento/paginação é responsabilidade do consumidor.
- **FR-023**: O sistema NÃO DEVE implementar cache interno por padrão; caching é responsabilidade do host. Suporte a cache opcional fica fora do escopo desta entrega.
- **FR-024**: O sistema NÃO DEVE armazenar transcrições em disco; processamento apenas em memória.
- **FR-025**: O sistema DEVE retornar resultado em formato estruturado consumível pela LLM (lista de objetos segmento).
- **FR-026**: O sistema DEVE falhar de forma silenciosa e segura sem interromper outras ferramentas quando ocorrer erro interno.
- **FR-027**: O sistema DEVE permitir que ausência de idiomas preferidos não impeça retorno de legenda alternativa.
- **FR-028**: O sistema DEVE registrar em logs a causa de falhas (URL inválida, sem legendas, erro de acesso). O payload permanece padronizado como null em erro, sem detalhar a causa para o consumidor.

### Key Entities
- **VideoTranscriptRequest**: Representa a solicitação de transcrição (atributos: videoUrl, preferredLanguages lista ordenada, timestamp de solicitação).
- **TranscriptSegment**: Representa um trecho de legenda (atributos: text, startInMs, durationMs). Relação: múltiplos TranscriptSegment associados a uma solicitação.
- **TranscriptResult**: Não será utilizado. O retorno do MCP será apenas uma lista de TranscriptSegment; atributos como selectedLanguage e statusCode não são expostos no payload.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
