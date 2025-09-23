
# Quickstart: Code Quality Improvements

This document provides instructions for validating the code quality improvements.

## Running Tests

To ensure that the refactoring has not changed the existing behavior, run the test suite:

```bash
npm test
```

## Running Code Coverage

Uma tarefa de cobertura foi adicionada. Para executar:

```bash
npm run coverage
```

Este comando gera o relatório com o percentual coberto e artefatos em `coverage/` (ex.: `lcov.info`, sumário em texto).

