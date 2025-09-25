# Tasks: Code Quality Improvements

**Input**: Design documents from `/specs/004-code-quality-improvements/`
**Prerequisites**: plan.md (required), research.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
	→ If not found: ERROR "No implementation plan found"
	→ Extract: tech stack, libraries, structure
2. Load optional design documents:
	→ data-model.md: Extract entities → model tasks
	→ contracts/: Each file → contract test task
	→ research.md: Extract decisions → setup tasks
3. Generate tasks by category:
	→ Setup: project init, dependencies, linting
	→ Tests: contract tests, integration tests
	→ Core: models, services, CLI commands
	→ Integration: DB, middleware, logging
	→ Polish: unit tests, performance, docs
4. Apply task rules:
	→ Different files = mark [P] for parallel
	→ Same file = sequential (no [P])
	→ Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
	→ All contracts have tests?
	→ All entities have models?
	→ All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Single project: `src/`, `tests/` at repository root

## Phase 3.1: Setup
- [X] T001 [P] Install and configure `jscpd` for duplicate code detection (add devDependency and npm script in `package.json`).
- [X] T002 [P] Install and configure `depcheck` to identify unused dependencies (add devDependency and npm script in `package.json`).
- [X] T003 [P] Enhance rules in `eslint.config.js` (e.g., `eslint-config-airbnb-base`) and add plugins for better code quality enforcement.
- [X] T004 [P] Install and configure a code coverage tool like `c8` or `nyc` (add devDependency in `package.json`).

## Phase 3.2: Code Analysis and Refactoring
- [X] T005 Run `jscpd` across the `src` directory and refactor identified duplicate code blocks. This task is sequential as it may involve multiple files.
- [X] T006 Run `depcheck` and remove any unused dependencies from `package.json`.
- [X] T007 Address all new ESLint errors and warnings by refactoring the code in the `src` directory.
- [X] T008 [P] Add or update JSDoc comments for all functions, classes, and methods in `src/**/*.js`. Ensure existing comments accurately reflect the current function behavior.
- [X] T009 Remove todos os comentários iniciados com `//` no código fonte sem criar novos scripts versionados.

## Phase 3.3: Integration and Automation
- [X] T010 Add a `coverage` script to `package.json` that runs the configured coverage tool on the existing tests, exporting results in `coverage/lcov.info` and text formats.
- [X] T011 Modify the existing GitHub workflow at `.github/workflows/run-tests.yml` to run the `npm run coverage` task instead of `npm test`, consolidating the CI steps.
- [X] T012 Add the `coverage/` directory to the `.gitignore` file.

## Phase 3.4: Coverage Enhancement
- [X] T013 Run initial coverage analysis to establish baseline coverage percentage for the `src/` directory.
- [X] T014 Identify uncovered code areas and write additional unit tests in `tests/unit/**/*.test.js` to achieve 90% line coverage minimum for all files in `src/`.
- [X] T015 Configure coverage tool with threshold settings to enforce minimum 90% coverage and fail the build if not met.

## Phase 3.5: Documentation
- [X] T016 Update `AGENTS.md` to reflect new development commands, quality gates, and workflows, including the 90% coverage requirement.

## Phase 3.6: Finalization
- [X] T017 Update the application version from 2.0.1 to 2.0.3 in `package.json`.

## Dependencies
- Setup tasks (T001-T004) should be completed before the analysis and refactoring tasks (T005-T009).
- The `coverage` script task (T010) must be completed before the GitHub workflow task (T011).
- Coverage enhancement tasks (T013-T015) depend on having the coverage tool configured (T004, T010).
- Coverage baseline analysis (T013) must be completed before writing additional tests (T014).
- Additional test writing (T014) must be completed before configuring coverage thresholds (T015).
- Documentation task T016 should be done after all other tasks are complete.
- Finalization task T017 should be the very last task.

## Parallel Example
```
# The setup tasks can be run in parallel:
Task: "Install and configure jscpd for duplicate code detection."
Task: "Install and configure depcheck to identify unused dependencies."
Task: "Enhance eslint.config.js with stricter rules..."
Task: "Install and configure a code coverage tool like c8 or nyc."
```
 
## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (where new tests are added)
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Validation Checklist
*GATE: Checked by main() before returning*

- [X] All contracts have corresponding tests (N/A for this feature)
- [X] All entities have model tasks (N/A for this feature)
- [X] All tests come before implementation (where applicable)
- [X] Parallel tasks truly independent
- [X] Each task specifies exact file path (where relevant)
- [X] No task modifies same file as another [P] task
