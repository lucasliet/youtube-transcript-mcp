# YouTube Transcript MCP Constitution

## Core Principles

### I. Entrega de uma única ferramenta
O pacote deve continuar focado na ferramenta `transcript_yt`, preservando contrato, argumentos e formato de resposta. Novas funcionalidades só são aceitas quando estendem a experiência dessa ferramenta (ex.: transporte remoto) sem fragmentar o produto em múltiplas APIs.

### II. Simplicidade operacional
Implementações priorizam dependências nativas do Node.js 18+, evitando frameworks adicionais. Arquiteturas novas precisam caber no mesmo processo do CLI e manter a paridade entre os modos stdio e remoto, reutilizando módulos existentes sempre que possível.

### III. Testes como gate de qualidade
Toda alteração significativa começa por testes automatizados (contratos, integração e unidade) que reproduzem o cenário alvo. Somente após observar o RED é permitido implementar. Regressões no stdio são tratadas com prioridade máxima.

### IV. Observabilidade enxuta
Logs devem ser categorizados (`invalid_request`, `tool_error`, etc.), com mensagens curtas e sem dados pessoais. Métricas externas ficam a cargo do operador; o projeto limita-se a fornecer hooks de log e códigos de erro consistentes.

### V. Segurança e privacidade pragmáticas
Nenhum segredo é armazenado ou versionado. Configurações sensíveis são lidas via variáveis de ambiente ou argumentos. O servidor remoto deve respeitar CORS configurável, evitar vazamento de dados do YouTube e seguir tempos limite para impedir abuso.

## Diretrizes operacionais
- Suporte obrigatório a Node.js 18 ou superior.
- Dependências extras só com justificativa de tamanho/tempo; preferir soluções nativas.
- Documentação (README, quickstart, AGENTS) precisa acompanhar toda nova superfície pública.
- JSON é o formato canônico de troca; respostas MCP usam `content` com `type: "text"` serializado.
- Flags de CLI devem aceitar override por string, booleano e número, com validação rígida.

## Fluxo de desenvolvimento
1. Ler a especificação ativa e atualizar `plan.md`/`tasks.md` conforme necessário.
2. Criar ou ajustar testes cobrindo o comportamento desejado.
3. Implementar a menor mudança que satisfaça os testes mantendo simplicidade.
4. Rodar `npm test` e `npm run lint` antes de solicitar revisão.
5. Registrar notas de mudança e atualizar documentos afetados.

## Governance
Esta constituição rege todas as PRs do repositório. Alterações devem ser documentadas neste arquivo com versão e data atualizadas. Revisores bloqueiam mudanças que violem os princípios acima ou que não comprovem testes e documentação atualizados.

**Version**: 1.0.0 | **Ratified**: 2025-09-30 | **Last Amended**: 2025-09-30
