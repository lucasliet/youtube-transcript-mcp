
# Quickstart: Code Quality Improvements

This document provides instructions for validating the code quality improvements.

## Running Tests

To ensure that the refactoring has not changed the existing behavior, run the test suite:

```bash
npm test
```

## Running Code Coverage

A new task will be added to calculate the code coverage of the test suite. To run it, use:

```bash
npm run coverage
```

This command will generate a report indicating the percentage of code that is covered by automated tests. The project maintains a minimum threshold of **90% line coverage** for all source files in the `src/` directory.

### Coverage Requirements

- **Target**: Minimum 90% line coverage across all files in `src/`
- **Enforcement**: The coverage tool is configured with threshold settings that will fail the build if coverage falls below 90%
- **Reporting**: Coverage reports are generated in both `lcov` and `text` formats for detailed analysis
