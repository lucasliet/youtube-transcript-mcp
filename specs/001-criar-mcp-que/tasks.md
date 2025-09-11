# Tasks: YouTube Transcript MCP Tool

**Input**: Design documents from `/specs/001-criar-mcp-que/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Execution Flow (main)
Refer to template; tasks customized para este feature.

## Format
`[ID] [P?] Description`

## Phase 3.1: Setup
- [ ] T001 Criar estrutura src/ e tests/{unit,integration,contract} (se inexistente)
- [ ] T002 Inicializar package.json (caso ausente) e adicionar fast-xml-parser dependência
- [ ] T003 [P] Adicionar script de testes usando node:test em package.json
- [ ] T004 [P] Configurar TypeScript: tsconfig.json básico (ES2022, moduleResolution node, outDir dist)
- [ ] T005 [P] Adicionar configuração mínima de lint (eslint) e script lint

## Phase 3.2: Tests First (TDD)
- [ ] T006 Criar teste unit extractVideoId casos válidos/invalidos em tests/unit/extractVideoId.test.ts
- [ ] T007 [P] Criar teste unit chooseTrack priorização (manual preferred, asr fallback, default track) em tests/unit/chooseTrack.test.ts
- [ ] T008 [P] Criar teste unit parseSegments para formato <transcript><text> em tests/unit/parseSegments_transcript.test.ts
- [ ] T009 [P] Criar teste unit parseSegments para formato <timedtext><body><p> em tests/unit/parseSegments_timedtext.test.ts
- [ ] T010 Criar teste unit normalization/remocao duplicados em tests/unit/normalizeSegments.test.ts
- [ ] T011 [P] Criar teste integração sucesso: vídeo com legendas manuais selecionando idioma preferido em tests/integration/success_manual.test.ts (mock fetch)
- [ ] T012 [P] Criar teste integração fallback para automática quando manual ausente em tests/integration/fallback_asr.test.ts (mock fetch)
- [ ] T013 [P] Criar teste integração sem legendas retorna null em tests/integration/no_captions.test.ts (mock fetch)
- [ ] T014 [P] Criar teste integração URL inválida retorna null em tests/integration/invalid_url.test.ts
- [ ] T015 [P] Criar teste integração vídeo inacessível (age restricted/unavailable) retorna null em tests/integration/inaccessible.test.ts
- [ ] T016 Criar teste integração idioma preferido não disponível escolhe primeira manual disponível em tests/integration/preferred_missing_manual.test.ts
- [ ] T017 [P] Criar teste integração matching prefixo idioma ("pt" casa "pt-BR") em tests/integration/language_prefix.test.ts

## Phase 3.3: Core Implementation (após confirmar falha dos testes)
- [ ] T018 Implementar util extractVideoId em src/lib/extractVideoId.ts
- [ ] T019 [P] Implementar util fetchWatchHtml handling consent em src/lib/fetchWatchHtml.ts
- [ ] T020 [P] Implementar util extractInnertubeApiKey em src/lib/extractInnertubeApiKey.ts
- [ ] T021 [P] Implementar util fetchInnertubePlayer em src/lib/fetchInnertubePlayer.ts
- [ ] T022 [P] Implementar util assertPlayability em src/lib/assertPlayability.ts
- [ ] T023 [P] Implementar util chooseTrack em src/lib/chooseTrack.ts
- [ ] T024 [P] Implementar util parseSegments em src/lib/parseSegments.ts
- [ ] T025 Implementar normalização e filtragem de segmentos em src/lib/normalizeSegments.ts
- [ ] T026 Implementar função principal transcript_yt em src/tool/transcriptYt.ts integrando utilitários
- [ ] T027 Atualizar export principal em src/index.ts registrando tool array
- [ ] T028 Adicionar logging categorizado em src/lib/log.ts e integrar

## Phase 3.4: Integration / Ajustes
- [ ] T029 Validar tipos TypeScript e corrigir inconsistências (npm run build ou tsc --noEmit)
- [ ] T030 [P] Ajustar testes para cobrir edge de timestamps 0 e duração 0
- [ ] T031 [P] Adicionar teste integração sem preferredLanguages (retorna default) em tests/integration/no_preferred.test.ts
- [ ] T032 [P] Adicionar teste integração duplicados eliminados em tests/integration/dedup.test.ts
- [ ] T033 Revisar tratamento de erros garantindo null uniforme

## Phase 3.5: Polish
- [ ] T034 Criar script build e verificar dist/ gerado
- [ ] T035 [P] Atualizar quickstart.md com caminhos reais se necessário
- [ ] T036 [P] Revisar lint e aplicar correções automáticas
- [ ] T037 [P] Revisar mensagens de log para consistência
- [ ] T038 Checar performance em vídeo longo simulado (mock grande) garantindo não truncamento
- [ ] T039 Verificar versão 0.1.0 em package.json
- [ ] T040 Preparar changelog inicial CHANGELOG.md (entrada 0.1.0) (se permitido)

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

