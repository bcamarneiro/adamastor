# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2026-01-09 11:50]
The Auto-Claude MCP server code is at /Applications/Auto-Claude.app/Contents/Resources/backend/ - changes to this code cannot be committed to the git repository as it's outside the working directory. Document changes in build-progress.txt instead.

_Context: Implementing error handling for push failures in qa.py required modifying the Auto-Claude app bundle directly_

## [2026-01-09 11:51]
Changes to Auto-Claude MCP server (qa.py, etc.) are made directly to the application bundle at /Applications/Auto-Claude.app/Contents/Resources/backend/ and are NOT tracked in git. These changes persist until the app is updated/reinstalled. Document all changes in build-progress.txt for reference.

_Context: subtask-2-2: Error handling for push failures - changes made to external MCP server application_

## [2026-01-09 12:17]
The .auto-claude-status file update logic is implemented via _update_status_file_pr_url() function in qa.py. It updates the main project's status file (not the worktree) with the PR URL when a PR is created. The pr_url field only appears when a PR exists.

_Context: subtask-4-2: Update .auto-claude-status with PR URL - implementation is in the Auto-Claude app bundle at /Applications/Auto-Claude.app/Contents/Resources/backend/_

## [2026-01-09 12:23]
Tests for Auto-Claude MCP server must be run from the tools directory itself (cd /Applications/Auto-Claude.app/Contents/Resources/backend/agents/tools_pkg/tools) for proper module imports to work.

_Context: subtask-5-1: Unit tests for PR command generation - pytest test file imports qa.py using relative import_
