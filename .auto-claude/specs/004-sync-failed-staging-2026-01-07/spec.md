# Specification: Investigate and Fix Staging Sync Workflow Failure (Issue #128)

## Overview

The staging sync workflow in GitHub Actions failed on 2026-01-07 (run #20772339098). This investigation task will diagnose the root cause of the sync failure, propose a solution, and implement the necessary fixes to restore the staging sync functionality. The sync process is critical for maintaining data consistency between environments, and this failure blocks the staging deployment pipeline.

## Workflow Type

**Type**: investigation

**Rationale**: This is a diagnostic task requiring root cause analysis before implementation. We must first examine the failed GitHub Actions run logs, understand what broke in the sync workflow, identify the affected workflow files, and then propose/implement a fix. The investigation phase is mandatory before any code changes can be made.

## Task Scope

### Services Involved
- **GitHub Actions Workflows** (primary) - CI/CD orchestration for sync operations
- **watcher** (potential) - May handle data sync operations based on dependencies
- **web** (indirect) - Staging deployment depends on successful sync

### This Task Will:
- [ ] Access and analyze the failed GitHub Actions run logs (run #20772339098)
- [ ] Identify the root cause of the staging sync failure
- [ ] Determine which workflow file(s) are affected (sync-photos.yml, sync-data.yml, or deploy-staging.yml)
- [ ] Assess whether this is a workflow config issue, code bug, or environment problem
- [ ] Propose and implement a fix for the sync failure
- [ ] Verify the fix resolves the issue without breaking production sync
- [ ] Document findings and solution approach

### Out of Scope:
- Production sync workflows (unless directly related to staging failure)
- Redesigning the entire sync architecture (unless absolutely necessary)
- Performance optimization of sync processes (unless directly causing the failure)
- Migration to different sync technologies

## Service Context

### GitHub Actions Workflows

**Tech Stack:**
- Platform: GitHub Actions
- Configuration: YAML workflow definitions
- Location: `.github/workflows/`

**Key Workflows:**
```bash
.github/workflows/sync-photos.yml
.github/workflows/sync-data.yml
.github/workflows/deploy-staging.yml
.github/workflows/release-production.yml
.github/workflows/ci.yml
```

**How to View Workflow Runs:**
```bash
# Via GitHub CLI
gh run view 20772339098 --log

# Or via web browser
open https://github.com/bcamarneiro/adamastor/actions/runs/20772339098
```

### Watcher Service

**Tech Stack:**
- Language: JavaScript/TypeScript
- Runtime: Bun
- Dependencies: Supabase, Backblaze B2, Vercel Blob, Sentry

**Entry Point:** `apps/watcher/index.ts`

**How to Run:**
```bash
cd apps/watcher
npm run start
```

**Port:** Not applicable (background service)

**Relevant Dependencies:**
- `@supabase/supabase-js` - Database sync
- `@vercel/blob` - Asset storage
- `backblaze-b2` - Backup storage

### Web Service

**Tech Stack:**
- Language: TypeScript
- Framework: React + Vite
- Deployment: Vercel (staging and production)

**Entry Point:** `apps/web/src/App.tsx`

**How to Run:**
```bash
cd apps/web
npm run dev
```

**Port:** 3000

## Files to Modify

**Note:** These files are identified based on project structure. The investigation phase will confirm which files actually require changes.

| File | Service | What to Change |
|------|---------|---------------|
| `.github/workflows/sync-data.yml` | GitHub Actions | Fix staging sync configuration (if data sync failed) |
| `.github/workflows/sync-photos.yml` | GitHub Actions | Fix staging photo sync configuration (if photo sync failed) |
| `.github/workflows/deploy-staging.yml` | GitHub Actions | Fix staging deployment dependencies (if deployment timing issue) |
| `apps/watcher/index.ts` | Watcher | Fix sync script logic (if code bug identified) |
| `apps/watcher/schemas/*` | Watcher | Update data schemas (if schema validation failure) |

## Files to Reference

These files will inform the investigation:

| File | Pattern to Copy |
|------|----------------|
| `.github/workflows/release-production.yml` | Production sync workflow patterns (for comparison) |
| `.github/workflows/ci.yml` | General CI workflow patterns and environment setup |
| `apps/watcher/package.json` | Dependencies and run scripts |
| `.env` files (watcher) | Environment variable configurations |

## Patterns to Follow

### GitHub Actions Workflow Structure

Expected pattern from `.github/workflows/` files:

```yaml
name: Sync [Type] - Staging

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup environment
        # Environment-specific setup

      - name: Run sync
        env:
          SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_KEY }}
        run: |
          # Sync commands
```

**Key Points:**
- Environment-specific secrets (staging vs production)
- Proper error handling and retry logic
- Conditional execution based on environment

### Error Handling Pattern

From Watcher service (expected pattern):

```typescript
try {
  // Sync operation
  await syncData();
} catch (error) {
  console.error('Sync failed:', error);
  // Sentry error reporting
  Sentry.captureException(error);
  process.exit(1);  // Fail workflow
}
```

**Key Points:**
- Explicit error capture and logging
- Integration with monitoring (Sentry)
- Proper exit codes for CI/CD

## Requirements

### Functional Requirements

1. **Root Cause Identification**
   - Description: Analyze failed workflow run logs to identify exact failure point
   - Acceptance: Document specific error message, failing step, and timestamp

2. **Environment Configuration Validation**
   - Description: Verify staging-specific secrets, environment variables, and credentials
   - Acceptance: Confirm all required secrets exist and are valid for staging

3. **Workflow Fix Implementation**
   - Description: Apply necessary fixes to workflow files or sync scripts
   - Acceptance: Workflow runs successfully on staging without errors

4. **Regression Prevention**
   - Description: Ensure fix doesn't break production sync or other workflows
   - Acceptance: Production sync continues to work; CI checks pass

5. **Documentation**
   - Description: Document root cause, solution, and prevention measures
   - Acceptance: Clear commit messages and issue comment explaining the fix

### Edge Cases

1. **Environment Secret Expiration** - Check if staging credentials expired or were rotated
2. **API Rate Limiting** - Verify if Supabase/Vercel API limits were hit
3. **Schema Drift** - Confirm staging database schema matches expected structure
4. **Concurrent Workflow Runs** - Check if multiple sync runs conflicted
5. **Resource Availability** - Verify GitHub Actions runner capacity and timeout limits
6. **Dependency Version Mismatch** - Check if a dependency update broke compatibility

## Implementation Notes

### DO
- Start by fetching the actual error logs from run #20772339098 using `gh run view`
- Compare staging workflow with production workflow to identify differences
- Check recent commits (last 7 days) for changes to sync workflows or watcher code
- Test the fix manually using `workflow_dispatch` before committing
- Verify staging environment secrets are correctly configured in GitHub repo settings
- Add additional logging/error handling if root cause indicates insufficient debugging info

### DON'T
- Make changes to production workflows without explicit need
- Skip testing the fix in staging before marking complete
- Assume the issue is code-related without checking workflow configuration first
- Modify multiple workflows simultaneously (isolate the fix)
- Remove error handling or retry logic to "simplify" the workflow

## Development Environment

### Access GitHub Actions Logs

```bash
# Install GitHub CLI if needed
brew install gh

# Authenticate
gh auth login

# View failed run
gh run view 20772339098 --log

# List recent workflow runs
gh run list --workflow=sync-data.yml --limit 5
gh run list --workflow=sync-photos.yml --limit 5
gh run list --workflow=deploy-staging.yml --limit 5
```

### Test Workflow Locally (if applicable)

```bash
# Install act for local workflow testing
brew install act

# Run workflow locally (may not work for all workflows)
act --workflows .github/workflows/sync-data.yml
```

### Start Services (for manual sync testing)

```bash
# Terminal 1: Start Supabase (if local testing needed)
npx supabase start

# Terminal 2: Run watcher sync manually
cd apps/watcher
npm run start

# Terminal 3: Check logs
tail -f apps/watcher/logs/*.log
```

### Service URLs
- Supabase (local): http://127.0.0.1:54321
- Web (local): http://localhost:3000
- GitHub Actions: https://github.com/bcamarneiro/adamastor/actions

### Required Environment Variables

**For Watcher Service:**
- `SUPABASE_URL`: Supabase project URL (staging)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access (staging)
- Additional variables may be discovered during investigation

**For GitHub Actions:**
- Secrets configured in: https://github.com/bcamarneiro/adamastor/settings/secrets/actions
- Environment-specific secrets under "Environments" → "staging"

## Success Criteria

The task is complete when:

1. [ ] **Root cause identified** - Specific error message and failure point documented
2. [ ] **Fix implemented** - Workflow configuration or code changes applied
3. [ ] **Staging sync verified** - Workflow runs successfully on staging (manual trigger test)
4. [ ] **Production unaffected** - Production sync still works (verify recent runs)
5. [ ] **No console errors** - Workflow logs show clean execution
6. [ ] **Issue documented** - GitHub Issue #128 updated with findings and solution
7. [ ] **Prevention measures noted** - Document how to prevent similar failures

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Watcher Sync Logic | `apps/watcher/__tests__/*.test.ts` (if exists) | Sync functions handle errors correctly |
| Schema Validation | `apps/watcher/schemas/*.test.ts` (if exists) | Data schemas validate correctly |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Supabase Connection | watcher ↔ Supabase | Database connection succeeds with staging credentials |
| Blob Storage Access | watcher ↔ Vercel Blob | File upload/download works in staging |
| Workflow Triggers | GitHub Actions ↔ APIs | Workflow can trigger and complete successfully |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Manual Sync Trigger | 1. Navigate to Actions tab 2. Select sync workflow 3. Click "Run workflow" → staging | Workflow completes with green checkmark |
| Scheduled Sync | 1. Wait for scheduled trigger OR 2. Modify schedule for immediate test | Workflow runs automatically and succeeds |
| Error Recovery | 1. Simulate error condition 2. Verify error handling | Error logged properly, workflow fails gracefully |

### GitHub Actions Verification
| Workflow | Run | Checks |
|----------|-----|--------|
| sync-data.yml (staging) | Manual trigger via `workflow_dispatch` | ✅ All steps complete, ✅ Data synced to staging, ✅ No error logs |
| sync-photos.yml (staging) | Manual trigger via `workflow_dispatch` | ✅ All steps complete, ✅ Photos synced to staging, ✅ No error logs |
| deploy-staging.yml | Auto-trigger on push/PR | ✅ Deployment succeeds, ✅ Dependencies sync correctly |
| release-production.yml | Check latest run | ✅ Still working (no regression) |

### Environment Verification
| Check | Command | Expected |
|-------|---------|----------|
| Staging secrets exist | `gh secret list --env staging` | All required secrets listed |
| Staging DB accessible | Manual test or API call | Connection succeeds, no auth errors |
| Blob storage accessible | Manual test or API call | Upload/download succeeds |

### QA Sign-off Requirements
- [ ] Root cause clearly identified and documented in Issue #128
- [ ] Fix applied to correct workflow file(s)
- [ ] Staging sync workflow runs successfully (tested via manual trigger)
- [ ] Production workflows still function correctly (no regressions)
- [ ] All relevant logs show clean execution (no errors/warnings)
- [ ] No security vulnerabilities introduced (secrets properly handled)
- [ ] Code follows established workflow patterns
- [ ] Issue #128 updated with solution summary and closed

## Investigation Checklist

Before implementing any fix, complete this investigation:

- [ ] **Access failed run logs** - `gh run view 20772339098 --log`
- [ ] **Identify failing step** - Which job/step failed? (checkout, setup, sync, deploy?)
- [ ] **Extract error message** - What was the exact error?
- [ ] **Check recent changes** - `git log --since="7 days ago" -- .github/workflows apps/watcher`
- [ ] **Compare environments** - Staging vs production workflow differences
- [ ] **Verify secrets** - Staging environment secrets exist and are valid
- [ ] **Check external dependencies** - Supabase status, Vercel status, GitHub Actions status
- [ ] **Review workflow schedule** - Has workflow been running successfully before?
- [ ] **Assess impact** - Is this blocking other processes?

## Complexity Assessment

**Initial Estimate:** Standard

**Rationale:**
- Investigation required before fix can be designed
- Likely a configuration or environment issue rather than complex code bug
- Sync workflows follow standard CI/CD patterns
- May escalate to Complex if root cause involves multiple services or infrastructure issues

**Factors that could increase complexity:**
- Infrastructure drift between staging and production
- External API changes breaking sync integration
- Database schema migration issues
- Cascading failures across multiple workflows
