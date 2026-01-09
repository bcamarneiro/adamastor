# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2026-01-09 11:50]
The Auto-Claude MCP server code is at /Applications/Auto-Claude.app/Contents/Resources/backend/ - changes to this code cannot be committed to the git repository as it's outside the working directory. Document changes in build-progress.txt instead.

_Context: Implementing error handling for push failures in qa.py required modifying the Auto-Claude app bundle directly_

## [2026-01-09 11:51]
Changes to Auto-Claude MCP server (qa.py, etc.) are made directly to the application bundle at /Applications/Auto-Claude.app/Contents/Resources/backend/ and are NOT tracked in git. These changes persist until the app is updated/reinstalled. Document all changes in build-progress.txt for reference.

_Context: subtask-2-2: Error handling for push failures - changes made to external MCP server application_
