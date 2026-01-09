# Specification: Auto-Claude PR Creation Before Human Review

## Overview

Currently, when using auto-claude, the workflow completes by staging changes to the main project and marking the task as "human_review" - requiring the user to manually commit and create a PR. The user wants the workflow to automatically create a Pull Request after QA approval, so that human review happens in GitHub where CI status is visible. This eliminates manual terminal operations and enables validation through GitHub's PR interface.

## Workflow Type

**Type**: feature

**Rationale**: This is an enhancement to the existing auto-claude workflow. It adds a new step (PR creation) between QA approval and human review, integrating with GitHub's PR and CI infrastructure. The core functionality exists; this extends it to provide a better developer experience.

## Task Scope

### Services Involved
- **auto-claude MCP server** (primary) - The external MCP server that orchestrates the auto-build workflow
- **git/GitHub CLI** (integration) - For branch pushing and PR creation via `gh pr create`

### This Task Will:
- [ ] Add automatic PR creation step after QA approval
- [ ] Push worktree branch to remote before creating PR
- [ ] Create PR using `gh pr create --base staging` with proper body format
- [ ] Store PR URL in `implementation_plan.json`
- [ ] Move task to "human_review" status only AFTER PR is created
- [ ] Update `.auto-claude-status` to include PR URL for visibility

### Out of Scope:
- Modifying the actual code generation/implementation phases
- Changing the QA approval process
- Automatic merging of PRs
- CI pipeline modifications

## Service Context

### Auto-Claude MCP Server

**Tech Stack:**
- Language: JavaScript/TypeScript (Node.js)
- Protocol: MCP (Model Context Protocol)
- Key directories: External to this repository (provided as MCP server)

**Entry Point:** MCP server runs as a subprocess providing tools

**Available Tools:**
```
mcp__auto-claude__update_subtask_status
mcp__auto-claude__get_build_progress
mcp__auto-claude__record_discovery
mcp__auto-claude__record_gotcha
mcp__auto-claude__get_session_context
mcp__auto-claude__update_qa_status
```

**How to Run:** Automatically started by Claude Code as MCP server

### Adamastor Project (Target)

**Tech Stack:**
- Language: TypeScript
- Framework: React (frontend), Bun (watcher)
- Key directories:
  - `.auto-claude/specs/` - Spec directories for each task
  - `.worktrees/` - Git worktrees for parallel development

**Entry Point:** N/A (repository being operated on)

**How to Run:**
```bash
cd apps/web && npm run dev
```

**Port:** 3000 (web frontend)

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| MCP Server - workflow state machine | auto-claude | Add new state between "qa_approved" and "human_review" for PR creation |
| MCP Server - PR creation logic | auto-claude | Implement `gh pr create` invocation after QA approval |
| `implementation_plan.json` schema | auto-claude | Add `pr_url`, `pr_number`, `branch_pushed` fields |
| `.auto-claude-status` schema | auto-claude | Add `pr_url` field for task visibility |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `.auto-claude/specs/*/implementation_plan.json` | Current schema structure with `status`, `qa_signoff`, `stagedAt` fields |
| `AUTO_CLAUDE.md` | PR creation commands and body format for Adamastor |
| `.claude/CLAUDE.md` | Complete GitHub workflow including `gh pr create` patterns |

## Patterns to Follow

### PR Creation Pattern

From `AUTO_CLAUDE.md`:

```bash
git push -u origin <branch-name>
gh pr create --base staging --title "..." --body "Closes #<number>

## What
[Brief description]

## Why
[Why this change is needed]

## How
[Implementation details]

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass (for bug fixes)
- [ ] Manual testing completed
"
```

**Key Points:**
- Always use `--base staging`, never `main`
- Include "Closes #<issue-number>" if linked to an issue
- Structured body with What/Why/How/Testing sections

### Implementation Plan Schema Pattern

From `.auto-claude/specs/006-implement-loading-screen-component/implementation_plan.json`:

```json
{
  "qa_signoff": {
    "status": "approved",
    "timestamp": "2026-01-07T18:35:00.000Z"
  },
  "status": "human_review",
  "stagedAt": "2026-01-07T22:27:55.518Z",
  "stagedInMainProject": true
}
```

**Proposed New Fields:**
```json
{
  "pr_created": {
    "url": "https://github.com/bcamarneiro/adamastor/pull/123",
    "number": 123,
    "branch": "feat/spec-006-loading-screen",
    "created_at": "2026-01-07T22:28:00.000Z"
  },
  "status": "human_review"
}
```

## Requirements

### Functional Requirements

1. **Automatic PR Creation After QA Approval**
   - Description: When QA agent approves a task, the workflow should automatically create a GitHub PR
   - Acceptance: PR appears in GitHub repository after QA approval, before status changes to "human_review"

2. **Branch Push Before PR**
   - Description: Worktree branch must be pushed to remote before PR creation
   - Acceptance: `git push -u origin <branch>` succeeds without manual intervention

3. **PR URL Tracking**
   - Description: The PR URL must be recorded in `implementation_plan.json`
   - Acceptance: `pr_created.url` field contains valid GitHub PR URL

4. **Human Review Triggered by PR**
   - Description: Status changes to "human_review" only after PR is successfully created
   - Acceptance: `status: "human_review"` only appears in implementation_plan.json when `pr_created.url` is set

5. **CI Status Visibility**
   - Description: User can validate changes in GitHub UI where CI status is displayed
   - Acceptance: PR page shows CI checks running/passed/failed

### Edge Cases

1. **Branch Push Failure** - Retry push, or mark task as "push_failed" with error message for manual intervention
2. **PR Creation Failure** - Retry with exponential backoff, or mark task as "pr_creation_failed" with error details
3. **Duplicate PR Exists** - Check for existing PR on branch before creating new one; link to existing if found
4. **No GitHub CLI Auth** - Fail gracefully with clear error message about `gh auth login` requirement
5. **Remote Branch Already Exists** - Use `git push --force-with-lease` for safety

## Implementation Notes

### DO
- Follow the PR body format in `AUTO_CLAUDE.md` exactly
- Use `gh pr create` with `--base staging` always
- Store PR URL immediately after creation for tracking
- Check for existing PRs before creating duplicates
- Use meaningful PR titles derived from spec/task name

### DON'T
- Create PRs targeting `main` branch
- Skip the branch push step (PR creation will fail)
- Leave tasks in "human_review" without a PR URL
- Use `git push --force` (prefer `--force-with-lease`)
- Create PRs without running QA approval first

## Development Environment

### Start Services

```bash
# Auto-claude MCP server starts automatically with Claude Code
# For Adamastor development:
cd apps/web && npm run dev
```

### Service URLs
- Web Frontend: http://localhost:3000
- Supabase (local): http://127.0.0.1:54321

### Required Environment Variables
- `GITHUB_TOKEN`: GitHub CLI authentication (handled by `gh auth login`)
- `SUPABASE_URL`: Database connection (existing)
- `SUPABASE_SERVICE_ROLE_KEY`: Database auth (existing)

## Success Criteria

The task is complete when:

1. [ ] After QA approval, a PR is automatically created targeting `staging` branch
2. [ ] PR URL is stored in `implementation_plan.json` under `pr_created.url`
3. [ ] Task status becomes "human_review" only after PR creation succeeds
4. [ ] User can click PR URL to view changes in GitHub
5. [ ] CI checks are visible on the PR page
6. [ ] No manual terminal commands required between QA approval and human review
7. [ ] Existing tests still pass
8. [ ] No console errors during workflow execution

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| PR creation command | MCP server test file | `gh pr create` called with correct args |
| Branch push logic | MCP server test file | `git push -u origin` called before PR creation |
| Status transition | MCP server test file | Status only changes to "human_review" after PR URL set |
| Duplicate PR check | MCP server test file | Existing PR detection works correctly |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Full workflow | auto-claude MCP + GitHub | Complete flow from QA approval to PR creation |
| Error handling | auto-claude MCP + GitHub | Graceful failure on push/PR errors |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| QA to PR | 1. Complete implementation 2. QA approves 3. Wait | PR created, URL stored, status "human_review" |
| View in GitHub | 1. Complete flow 2. Click PR URL | PR page loads with CI checks visible |

### Browser Verification (if frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| N/A | N/A | This is backend/workflow change |

### Database Verification (if applicable)
| Check | Query/Command | Expected |
|-------|---------------|----------|
| N/A | N/A | No database changes |

### GitHub Verification
| Check | Command | Expected |
|-------|---------|----------|
| PR exists | `gh pr view <number>` | PR details displayed |
| CI running | `gh pr checks <number>` | Checks listed with status |
| Base branch | `gh pr view <number> --json baseRefName` | `"baseRefName": "staging"` |

### QA Sign-off Requirements
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] PR creation verified with real GitHub
- [ ] PR targets staging branch (never main)
- [ ] PR URL stored in implementation_plan.json
- [ ] Status transitions correctly
- [ ] No regressions in existing functionality
- [ ] Code follows established patterns
- [ ] No security vulnerabilities introduced

## Implementation Approach

### Recommended Workflow State Machine Update

```
Current:
  building → qa_review → qa_approved → human_review

Proposed:
  building → qa_review → qa_approved → pushing_branch → creating_pr → human_review
                                             ↓                ↓
                                        push_failed      pr_creation_failed
```

### Key Code Changes (Pseudo-code)

```javascript
// After QA approval
async function transitionToHumanReview(specDir) {
  const plan = readImplementationPlan(specDir);

  // 1. Push branch to remote
  const branchName = `feat/spec-${plan.specId}`;
  await exec(`git push -u origin ${branchName}`);

  // 2. Check for existing PR
  const existingPR = await exec(`gh pr list --head ${branchName} --json url`);
  if (existingPR.length > 0) {
    plan.pr_created = { url: existingPR[0].url, ... };
  } else {
    // 3. Create new PR
    const prBody = generatePRBody(plan);
    const result = await exec(`gh pr create --base staging --title "${plan.feature}" --body "${prBody}"`);
    plan.pr_created = { url: result.url, number: result.number, ... };
  }

  // 4. Only now set to human_review
  plan.status = 'human_review';
  writeImplementationPlan(specDir, plan);
}
```

## Notes

- The auto-claude MCP server is external to this repository
- This spec documents behavior changes needed in that external system
- Implementation will require access to the MCP server source code
- The Adamastor project provides reference patterns for PR format and git workflow
