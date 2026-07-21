---
name: youtube-transcript-cli
description: >
  Obtém transcrições de vídeos do YouTube via linha de comando (CLI/npx). Use esta skill
  sempre que o usuário compartilhar uma URL do YouTube e quiser ler, resumir, analisar,
  transcrever ou extrair informações do vídeo — e não houver uma ferramenta MCP transcript_yt
  disponível, ou o agente tiver acesso a terminal/bash. Exemplos de trigger: "transcreve esse
  vídeo", "o que esse vídeo fala?", "me dá um resumo", "quais os pontos principais?", colar uma
  URL do YouTube sem mais contexto quando a intenção implica entender o conteúdo. Aciona também
  quando o usuário pede para responder perguntas sobre o conteúdo de um vídeo.
---

## O que esta skill faz

Usa a CLI `youtube-transcript-mcp` (via npx ou local) para buscar a transcrição (legendas) de
qualquer vídeo do YouTube e processa o resultado de acordo com o que o usuário precisa.

Esta skill é uma alternativa à ferramenta MCP `transcript_yt` — use quando não houver MCP
configurado mas houver acesso a terminal (bash/Node 18+).

## Pré-requisitos

- Node.js 18+ instalado (para uso via npx ou node)
- Acesso a internet (o CLI faz fetch do YouTube)

Nenhuma instalação permanente é necessária — `npx` baixa o pacote sob demanda.

## Como invocar

### Via npx (recomendado — sem instalação)

```bash
npx -y --package=github:lucasliet/youtube-transcript-mcp#main youtube-transcript-mcp --videoUrl "URL_DO_VIDEO" --preferredLanguages "pt-BR,en"
```

### Via instalação local no projeto

```bash
npm i github:lucasliet/youtube-transcript-mcp#main
npx youtube-transcript-mcp --videoUrl "URL_DO_VIDEO" --preferredLanguages "pt-BR,en"
```

### Via node direto (clone do repositório)

```bash
node src/cli.js --videoUrl "URL_DO_VIDEO" --preferredLanguages "pt-BR,en"
```

## Parâmetros

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `--videoUrl` | sim | URL do vídeo (`watch?v=`, `youtu.be/`, `embed/`, `v/`, `live/`) |
| `--preferredLanguages` | não | Lista ordenada de idiomas em CSV, ex: `"pt-BR,en"`. Default: automático |

## Saída

O CLI imprime JSON no **stdout**. Não há logs extras no stdout — qualquer log vai para stderr.

**Sucesso** — array de segmentos:
```json
[
  { "text": "Intro...", "startInMs": 0, "duration": 2300 },
  { "text": "Próximo segmento", "startInMs": 2300, "duration": 1800 }
]
```

**Falha** — imprime `null` no stdout e detalhes categorizados no stderr.

Sempre faça `JSON.parse` do stdout para obter o resultado. Se o resultado for `null`, o vídeo
não tem legendas disponíveis ou é inacessível (privado, sem legendas, bloqueado).

## Fluxo de trabalho

### 1. Identificar a intenção do usuário

Antes de chamar o CLI, entenda o que o usuário quer fazer com a transcrição:

- **Transcrição completa**: mostrar o texto com timestamps, fiel ao vídeo
- **Resumo**: síntese estruturada do conteúdo
- **Pontos principais / bullet points**: lista dos tópicos abordados
- **Responder perguntas**: buscar informação específica dentro do conteúdo
- **Análise**: extrair insights, opiniões, dados mencionados

Se não estiver claro, assuma que o usuário quer uma **transcrição formatada com resumo**.

### 2. Definir preferências de idioma

- Se o usuário pediu em português: `--preferredLanguages "pt-BR,pt,en"`
- Se o usuário pediu em inglês: `--preferredLanguages "en,pt-BR,pt"`
- Se não foi especificado: use `"pt-BR,pt,en"` como padrão

### 3. Executar o CLI e tratar o resultado

Execute o comando via bash e faça `JSON.parse` do stdout:

- Se `null`: informe que o vídeo não tem legendas disponíveis
- Se array vazio: trate igual ao `null`
- Se bem-sucedido: processe conforme o modo solicitado

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
- **Tratamento de erro**: se o CLI falhar (retornar `null`), verifique se a URL é válida e se o
  vídeo tem legendas ativadas antes de reportar o problema ao usuário
