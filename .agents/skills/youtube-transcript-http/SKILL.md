---
name: youtube-transcript-http
description: >
  Obtém transcrições de vídeos do YouTube via HTTP REST API. Use esta skill sempre que o
  usuário compartilhar uma URL do YouTube e quiser ler, resumir, analisar, transcrever ou
  extrair informações do vídeo — e o agente tiver acesso a internet via HTTP (fetch/curl),
  sem depender de MCP ou Node/CLI instalados. Exemplos de trigger: "transcreve esse vídeo",
  "o que esse vídeo fala?", "me dá um resumo", "quais os pontos principais?", colar uma URL
  do YouTube sem mais contexto quando a intenção implica entender o conteúdo. Ideal para
  agentes rodando em ambientes serverless, browsers, ou sem acesso a subprocess/terminal.
  Aciona também quando o usuário pede para responder perguntas sobre o conteúdo de um vídeo.
---

## O que esta skill faz

Faz uma requisição HTTP GET para a API REST pública em
`https://ytranscript.lucasliet.com.br/transcript` para buscar a transcrição (legendas) de
qualquer vídeo do YouTube e processa o resultado de acordo com o que o usuário precisa.

Esta skill é uma alternativa à CLI e à ferramenta MCP — use quando tiver acesso a HTTP mas
não a terminal subprocess ou MCP configurado.

## Endpoint

```
GET https://ytranscript.lucasliet.com.br/transcript
```

## Parâmetros (query string)

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `videoUrl` | sim | URL completa do YouTube (`watch?v=`, `youtu.be/`, `embed/`, `v/`, `live/`) |
| `preferredLanguages` | não | Lista ordenada de idiomas em CSV, ex: `pt-BR,en`. Default: automático |

## Como invocar

### Via curl (terminal)

```bash
curl -s "https://ytranscript.lucasliet.com.br/transcript?videoUrl=https://www.youtube.com/watch?v=VIDEO_ID&preferredLanguages=pt-BR,en"
```

### Via fetch (JavaScript/Node/Browser)

```javascript
const url = 'https://ytranscript.lucasliet.com.br/transcript'
const params = new URLSearchParams({
  videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
  preferredLanguages: 'pt-BR,en'
})
const res = await fetch(`${url}?${params}`)
const data = await res.json()
```

### Via Python (requests)

```python
import requests

params = {
    'videoUrl': 'https://www.youtube.com/watch?v=VIDEO_ID',
    'preferredLanguages': 'pt-BR,en'
}
res = requests.get('https://ytranscript.lucasliet.com.br/transcript', params=params)
data = res.json()
```

Sempre codifique a URL do vídeo na query string (URL-encode) para evitar ambiguidades com
`&`, `?`, e `=`.

## Resposta

### Sucesso (200)

```json
{
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "preferredLanguages": ["pt-BR", "en"],
  "segments": [
    { "text": "Intro...", "startInMs": 0, "duration": 2300 },
    { "text": "Próximo segmento", "startInMs": 2300, "duration": 1800 }
  ]
}
```

A transcrição está em `data.segments` — um array de objetos `{ text, startInMs, duration }`.

### Erros

| Status | Campo `error.code` | Quando |
|--------|---------------------|--------|
| 400 | `invalid_request` | `videoUrl` ausente ou ID inválido |
| 405 | `method_not_allowed` | Método HTTP diferente de `GET`/`OPTIONS` |
| 502 | `transcript_unavailable` | YouTube bloqueou, vídeo privado/sem legendas, rede |

Shape do erro:
```json
{
  "error": {
    "code": "transcript_unavailable",
    "message": "Unable to retrieve transcript"
  }
}
```

Sempre verifique o HTTP status code antes de processar `segments`. Se o status não for 200,
trate como falha e informe o usuário conforme a tabela acima.

## Fluxo de trabalho

### 1. Identificar a intenção do usuário

Antes de chamar a API, entenda o que o usuário quer fazer com a transcrição:

- **Transcrição completa**: mostrar o texto com timestamps, fiel ao vídeo
- **Resumo**: síntese estruturada do conteúdo
- **Pontos principais / bullet points**: lista dos tópicos abordados
- **Responder perguntas**: buscar informação específica dentro do conteúdo
- **Análise**: extrair insights, opiniões, dados mencionados

Se não estiver claro, assuma que o usuário quer uma **transcrição formatada com resumo**.

### 2. Definir preferências de idioma

- Se o usuário pediu em português: `preferredLanguages=pt-BR,pt,en`
- Se o usuário pediu em inglês: `preferredLanguages=en,pt-BR,pt`
- Se não foi especificado: use `pt-BR,pt,en` como padrão

### 3. Fazer a requisição e tratar o resultado

Faça o GET na API e verifique o status code:

- Se `200`: processe `data.segments` conforme o modo solicitado
- Se `502` (`transcript_unavailable`): informe que o vídeo não tem legendas disponíveis
- Se `400` (`invalid_request`): a URL fornecida é inválida — peça uma URL correta

### 4. Converter timestamps

Converta `startInMs` para o formato legível `mm:ss` (ou `h:mm:ss` para vídeos longos):

```
startInMs / 1000 = segundos totais
h = Math.floor(segundos / 3600)
m = Math.floor((segundos % 3600) / 60)
s = segundos % 60
```

Use `h:mm:ss` somente quando o vídeo tiver mais de 1 hora.

## Formatos de saída

### Transcrição completa

```
## Transcrição — [Título inferido ou "Vídeo"]

[0:00] Texto do segmento aqui
[0:05] Próximo segmento
[1:23] Segmento com mais de um minuto
...
```

Agrupe segmentos consecutivos curtos em blocos de ~5-10 segundos para melhor legibilidade.
Não liste cada segmento individualmente se eles tiverem menos de 3 palavras.

### Resumo

```
## Resumo — [Assunto do vídeo]

**Sobre o vídeo:** [1-2 frases descrevendo o tema central]

**Pontos principais:**
- ...
- ...

**Conclusão:** [O que o vídeo conclui ou recomenda]
```

### Pontos principais

Lista de bullets diretos, sem introduções longas. Cada ponto deve ser autoexplicativo.

### Resposta a perguntas

Busque nas transcrições os trechos relevantes, cite o timestamp, e responda diretamente.
Se a informação não estiver no vídeo, diga claramente.

## Boas práticas

- **Seja fiel ao conteúdo**: não invente informações que não estão na transcrição
- **Cite timestamps** quando responder perguntas específicas — ajuda o usuário a verificar
- **Vídeos longos**: para vídeos com mais de 30 minutos, ofereça um resumo mesmo se o usuário
  pediu transcrição completa, e pergunte se quer ver tudo
- **Qualidade da transcrição**: legendas automáticas (ASR) podem conter erros — mencione isso
  se perceber que o texto está confuso
- **Idioma do output**: responda no mesmo idioma que o usuário usou na pergunta,
  independentemente do idioma da transcrição
- **Timeout**: a API pode levar alguns segundos para vídeos longos — use um timeout razoável
  (15-30s) nas requisições
- **URL-encoding**: sempre codifique `videoUrl` na query string para evitar caracteres
  reservados (`&`, `?`, `=`) quebrarem o parse no servidor
