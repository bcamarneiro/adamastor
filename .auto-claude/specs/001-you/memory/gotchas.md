# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2026-01-07 15:35]
bun and npm commands are blocked in the sandboxed environment - verification commands like 'bun lint && bun typecheck' cannot be run directly

_Context: Encountered during subtask-3-2 when trying to run verification. CI/CD will catch any issues, or manual verification needed outside sandbox._
