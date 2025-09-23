
# Research: Code Quality Improvements

This document outlines the decisions made to clarify ambiguities in the feature specification for code quality improvements.

## "Nonsense Code" Definition

- **Decision**: "Nonsense code" will be defined as code that is objectively non-functional or redundant.
- **Rationale**: The term "nonsense" is subjective. A concrete definition allows for automated detection and avoids ambiguity.
- **Details**: This includes:
  - Unreachable code blocks (guarded by ESLint `no-unreachable`).
  - Variables, functions, and classes that are declared but never used (ESLint `no-unused-vars`).
  - Duplicate logic across files (caught by `npm run duplicate-check`, powered by `jscpd`).
  - Declared dependencies that are never required at runtime (`npm run unused-deps` via `depcheck`).
- **Enforcement**: The GitHub Actions job **Test** now runs `npm run lint`, `npm run duplicate-check`, and coverage collection on every push/PR. Local contributors can reproduce with the same commands.

## "Best Practices" Definition

- **Decision**: "Best practices" will be enforced using a standard, popular ESLint configuration.
- **Rationale**: This provides a clear, automated, and industry-accepted standard for code quality. It avoids relying on subjective manual reviews.
- **Details**: The flat config consumes `eslint-config-airbnb-base` through `FlatCompat`, layered on top of `@eslint/js` and custom project rules (no semicolons, `eqeqeq`, `prefer-const`, etc.). Overrides disable conflicting opinions (e.g., `import/extensions`) while preserving the broader rule-set.

