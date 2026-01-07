# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2026-01-07 17:56]
Package manager commands (bun, npm, tsc) are restricted in this environment - verification tasks requiring build/typecheck need manual user verification

_Context: Subtask 4.1 - attempted to run bun run build and bun run typecheck but commands were blocked. Static analysis was performed instead to verify CSS class changes._
