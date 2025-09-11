# Data Model: YouTube Transcript MCP Tool

## Entities

### VideoTranscriptRequest
Campos:
- videoUrl: string (URL completa fornecida)
- preferredLanguages: string[] opcional (ordenada por prioridade)

Regras:
- videoUrl deve conter ID extraível de 11 caracteres alfanuméricos (_ e - permitidos)
- preferredLanguages normalizado para lowercase para matching

### TranscriptSegment
Campos:
- text: string (conteúdo da legenda, trim aplicado)
- startInMs: number (inteiro >= 0)
- duration: number (inteiro >= 0)

Regras:
- Ordem de saída deve ser crescente por startInMs
- Segmentos vazios removidos
- Duplicados (mesmo texto + startInMs) descartados

## Derived Data
- selectedLanguage (não exposto; usado apenas internamente para seleção de track)

## Validation Flow
1. Validar videoUrl → extrair ID ou falhar
2. Normalizar preferredLanguages (lowercase)
3. Após parsing XML → construir lista preliminar
4. Filtrar inválidos / vazios / ordenar / remover duplicados

## Error Conditions (internas)
- invalid_url → retorna null
- inaccessible (restrição, indisponível) → null
- no_captions → null
- network_error → null
- other_error → null
