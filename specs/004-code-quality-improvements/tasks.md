# Tasks: Code Quality Improvements

**Input**: Design documents from `/specs/003-code-quality-improvements/`
**Prerequisites**: plan.md, research.md, quickstart.md

## Phase 3.1: Setup
- [X] T001 [P] Install and configure `jscpd` for duplicate code detection.
- [X] T002 [P] Install and configure `depcheck` to identify unused dependencies.
- [X] T003 [P] Enhance `eslint.config.js` with stricter rules (e.g., `eslint-config-airbnb-base`) and plugins for better code quality enforcement.
- [X] T004 [P] Install and configure a code coverage tool like `c8` or `nyc`.

## Phase 3.2: Code Analysis and Refactoring
- [X] T005 Run `jscpd` across the `src` directory and refactor identified duplicate code blocks. This task is sequential as it may involve multiple files.
- [X] T006 Run `depcheck` and remove any unused dependencies from `package.json`.
- [X] T007 Address all new ESLint errors and warnings by refactoring the code in the `src` directory.
- [X] T008 [P] Add or update JSDoc comments for all functions, classes, and methods in the `src` directory. Ensure existing comments accurately reflect the current function behavior.
- [X] T009 Create a script to remove all `//` comments from the codebase or perform a manual search and replace.

## Phase 3.3: Integration and Automation
- [X] T010 Add a `coverage` script to `package.json` that runs the configured coverage tool on the existing tests, exporting the results in `lcov` and `text` formats.
- [X] T011 Modify the existing GitHub workflow at `.github/workflows/run-tests.yml` to run the `npm run coverage` task instead of `npm test`, consolidating the CI steps.
- [X] T012 Add the `coverage/` directory to the `.gitignore` file.

## Phase 3.4: Documentation
- [X] T013 Update AGENTS.md to reflect new development commands, quality gates, and workflows.

## Phase 3.5: Finalization
- [X] T014 Update the application version from 2.0.1 to 2.0.2 in `package.json`.

## Dependencies
- Setup tasks (T001-T004) should be completed before the analysis and refactoring tasks (T005-T009).
- The `coverage` script task (T010) must be completed before the GitHub workflow task (T011).
- Documentation task T013 should be done after all other tasks are complete.
- Finalization task T014 should be the very last task.

## Parallel Example
```
# The setup tasks can be run in parallel:
Task: "Install and configure jscpd for duplicate code detection."
Task: "Install and configure depcheck to identify unused dependencies."
Task: "Enhance eslint.config.js with stricter rules..."
Task: "Install and configure a code coverage tool like c8 or nyc."
```