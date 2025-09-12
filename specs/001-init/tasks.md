# Tasks: YouTube Transcript MCP Tool

**Input**: Design documents from `/specs/001-init/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Execution Flow (main)
Refer to template; tasks customized para este feature.

## Format
`[ID] [P?] Description`

## Phase 3.1: Setup
- [x] T001 Criar estrutura src/ e tests/{unit,integration} (JS ESM)
- [x] T002 Inicializar package.json (ESM, bin src/cli.js) e adicionar @modelcontextprotocol/sdk
- [x] T003 Adicionar script de testes usando node:test em package.json
- [x] T004 Definir execução via npx GitHub (prepare removido; JS direto)
- [ ] T005 [P] Adicionar configuração mínima de lint (eslint) e script lint

## Phase 3.2: Tests First (TDD)
- [x] T006 Criar teste unit extractVideoId casos válidos/invalidos em tests/unit/extractVideoId.test.js
- [x] T007 Criar teste unit chooseTrack priorização (manual preferred, asr fallback, default track) em tests/unit/chooseTrack.test.js
- [x] T008 Criar teste unit parseSegments para formato <transcript><text> e <timedtext><body><p> em tests/unit/parseSegments.test.js
- [x] T010 Criar teste unit normalization/remocao duplicados em tests/unit/normalizeSegments.test.js
- [x] T011 Criar teste integração sucesso: manual preferido em tests/integration/success_manual.test.js (mock fetch)
- [x] T012 Criar teste integração fallback para automática quando manual ausente em tests/integration/fallback_asr.test.js (mock fetch)
- [x] T013 Criar teste integração sem legendas retorna null em tests/integration/no_captions.test.js (mock fetch)
- [x] T014 Criar teste integração URL inválida retorna null em tests/integration/invalid_url.test.js
- [x] T015 Criar teste integração vídeo inacessível (age restricted/unavailable) retorna null em tests/integration/inaccessible.test.js
- [x] T016 Criar teste integração idioma preferido não disponível escolhe primeira manual disponível em tests/integration/preferred_missing_manual.test.js
- [x] T017 Criar teste integração matching prefixo idioma ("pt" casa "pt-BR") em tests/integration/language_prefix.test.js
- [x] T017b Criar teste integração chamadas repetidas sem cache em tests/integration/repeated_calls.test.js

## Phase 3.3: Core Implementation (após confirmar falha dos testes)
- [x] T018 Implementar util extractVideoId em src/lib/extractVideoId.js
- [x] T019 Implementar util fetchWatchHtml handling consent em src/lib/fetchWatchHtml.js
- [x] T020 Implementar util extractInnertubeApiKey em src/lib/extractInnertubeApiKey.js
- [x] T021 Implementar util fetchInnertubePlayer em src/lib/fetchInnertubePlayer.js
- [x] T022 Implementar util assertPlayability em src/lib/assertPlayability.js
- [x] T023 Implementar util chooseTrack em src/lib/chooseTrack.js
- [x] T024 Implementar util parseSegments em src/lib/parseSegments.js
- [x] T025 Implementar normalização e filtragem de segmentos em src/lib/normalizeSegments.js
- [x] T026 Implementar função principal transcript_yt em src/tool/transcriptYt.js integrando utilitários
- [x] T027 Atualizar export principal em src/index.js registrando tool array
- [x] T028 Adicionar logging categorizado em src/lib/log.js e integrar

## Phase 3.4: Integration / Ajustes
- [x] T029 Validar handlers MCP (ListTools/CallTool) e tipo de retorno (text) compatível com SDK
- [ ] T030 [P] Ajustar testes para cobrir edge de timestamps 0 e duração 0
- [ ] T031 [P] Adicionar teste integração sem preferredLanguages (retorna default) em tests/integration/no_preferred.test.js
- [ ] T032 [P] Adicionar teste integração duplicados eliminados em tests/integration/dedup.test.js
- [x] T033 Revisar tratamento de erros garantindo null uniforme

## Phase 3.5: Polish
- [ ] T034 [P] Adicionar lint e checagens opcionais
- [x] T035 Atualizar quickstart.md com execução via GitHub main
- [ ] T036 [P] Revisar mensagens de log para consistência
- [ ] T037 [P] Checar performance em vídeo longo simulado (mock grande) garantindo não truncamento
- [x] T039 Verificar versão 0.1.0 em package.json

## Dependencies
- T006-T017 antes de T018-T028
- T018 antes de T026
- T019-T024 antes de T026
- T026 antes de T027
- T026 antes de T029-T033
- T029 antes de polish tasks que dependem de tipos

## Parallel Examples
```
# Execução paralela inicial (unit parse variants e chooseTrack):
T007, T008, T009

# Execução paralela integração (cenários independentes):
T011, T012, T013, T014, T015, T017

# Execução paralela utilities:
T019, T020, T021, T022, T023, T024
```

## Validation Checklist
- [x] Todos entidades possuem tarefas de implementação
- [x] Todos cenários de user story possuem testes de integração
- [x] Testes antes de implementação
- [x] Tarefas paralelas usam arquivos distintos
- [x] Cada tarefa cita caminho de arquivo
- [x] Sem conflito de escrita em paralelo
