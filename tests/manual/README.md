# Manual Test Scripts

This folder contains manual test scripts for testing API endpoints and features during development.

## Files

- `test-directory-api.js` - Tests for the directory/public polls API
- `test-directory-filters.js` - Tests for directory filtering and sorting
- `test-enhanced-directory-api.js` - Enhanced directory API tests
- `test-poll-fixes.js` - Tests for poll-related bug fixes
- `test-voting-page.js` - Tests for the voting page functionality

## Usage

These are Node.js scripts that can be run directly:

```bash
node tests/manual/test-directory-api.js
```

## Note

These are manual test scripts for development purposes. For automated testing, see the `src/__tests__` directory which contains Jest/Vitest test suites.
