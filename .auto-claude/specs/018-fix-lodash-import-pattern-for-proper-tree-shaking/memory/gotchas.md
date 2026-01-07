# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2026-01-07 17:40]
Runtime commands (bun, npm, npx, node, tsc) are not available in this restricted sandbox environment. Verification subtasks requiring these commands must be completed via static analysis and marked for manual runtime verification by the user.

_Context: Subtask 3.1 required running `bun typecheck` but the command was blocked. Used manual static analysis to verify TypeScript compatibility of the lodash/debounce path import instead._
