# Investigation Report: Staging Sync Workflow Failure

**Issue:** [#128](https://github.com/bcamarneiro/adamastor/issues/128) - Sync failed (staging) - 2026-01-07
**Workflow Run:** [#20772339098](https://github.com/bcamarneiro/adamastor/actions/runs/20772339098)
**Investigation Date:** 2026-01-07

---

## Executive Summary

The staging data sync workflow failed on 2026-01-07 at 06:06:56 UTC. Investigation reveals that **both staging and production sync runs failed** on the same day with the identical failure pattern, suggesting a common root cause affecting all environments.

---

## Failure Details

### Primary Failed Run (Staging)

| Property | Value |
|----------|-------|
| **Run ID** | 20772339098 |
| **Workflow** | Sync Data (`sync-data.yml`) |
| **Environment** | staging |
| **Event Trigger** | schedule (cron: `0 6 * * *`) |
| **Started At** | 2026-01-07T06:06:56Z |
| **Completed At** | 2026-01-07T06:07:22Z |
| **Duration** | ~26 seconds |
| **Status** | completed |
| **Conclusion** | **failure** |

### Failing Step

| Property | Value |
|----------|-------|
| **Step Name** | `Sync data` |
| **Step Number** | 8 |
| **Started At** | 2026-01-07T06:07:13Z |
| **Completed At** | 2026-01-07T06:07:19Z |
| **Duration** | ~6 seconds |
| **Exit Code** | 1 |

### Error Annotation

```
Path: .github
Line: 144
Level: failure
Message: "Process completed with exit code 1."
```

---

## Job Execution Timeline (Staging Run)

| Step # | Step Name | Status | Conclusion | Duration |
|--------|-----------|--------|------------|----------|
| 1 | Set up job | completed | success | ~2s |
| 2 | Get latest release tag (production only) | completed | **skipped** | - |
| 3 | Skip if no release (production) | completed | **skipped** | - |
| 4 | Checkout code | completed | success | <1s |
| 5 | Setup Bun | completed | success | ~2s |
| 6 | Install dependencies | completed | success | ~2s |
| 7 | Cache snapshots | completed | success | ~1s |
| 8 | **Sync data** | completed | **failure** | ~6s |
| 9 | Sync photos to Supabase Storage | completed | skipped | - |
| 10 | Smoke test (production only) | completed | skipped | - |
| 11 | Notify on failure | completed | success | ~1s |

---

## Critical Finding: Both Environments Failed

The production sync run (#20773607509) at 07:11:40 UTC also failed with the **exact same failure pattern**:

| Run | Environment | Time (UTC) | Failing Step | Exit Code |
|-----|-------------|------------|--------------|-----------|
| #20772339098 | staging | 06:06:56 | Sync data (step 8) | 1 |
| #20773607509 | production | 07:11:40 | Sync data (step 8) | 1 |

This indicates the root cause is **not environment-specific** and likely related to:
1. External API availability (Parliament data sources)
2. A recent code change affecting both branches
3. Shared infrastructure issue

---

## Environment Context

### Staging Environment

- **Branch:** `staging` (ref: `3c2f777e67b77c52f549cbca33788699979d4f87`)
- **Last Commit:** 2026-01-06T11:47:12Z - "chore(e2e): add regression tests for closed issues"
- **Scheduled Cron:** `0 6 * * *` (6 AM UTC daily)

### Production Environment

- **Branch:** Uses latest release tag via `actions/github-script`
- **Head SHA:** `d0129178a60fc92e93938cd4a6d4da04f8532525`
- **Last Commit:** 2026-01-02T22:28:38Z - "chore: bump version to v0.1.2"
- **Scheduled Cron:** `0 7 * * *` (7 AM UTC daily)

---

## Command Executed in Failing Step

The "Sync data" step runs:

```bash
echo "Syncing to $ENVIRONMENT"
FORCE_FLAG="${{ inputs.force }}"
if [ "$FORCE_FLAG" = "true" ]; then
  echo "Force mode enabled - running full sync"
  bun run start -- --force
else
  bun run start
fi
```

Which executes: `bun run src/commands/sync.ts`

### Sync Command Pipeline

The sync command performs:
1. **Fetch** - Download datasets from Parliament API:
   - `informacao_base` (deputies, parties, districts)
   - `agenda` (parliamentary agenda)
   - `atividades` (activities/debates)
   - `iniciativas` (initiatives/proposals)
2. **Check for Changes** - Compare hashes with previous snapshot
3. **Transform Pipeline** - Process data through 4 phases:
   - Phase 1: Foundation (parties + districts)
   - Phase 2: Deputies
   - Phase 3: Data transforms + scraping (parallel)
   - Phase 4: Statistics
4. **Update Sync State** - Store new hashes

---

## Potential Root Causes

### High Probability

1. **External API Failure (Parliament Data Source)**
   - The Parliament API URLs may be returning errors or invalid data
   - Short execution time (~6s) suggests early failure during fetch
   - Both environments fetch from the same Parliament API

2. **Supabase Connection Issue**
   - The `supabase.ts` client throws immediately if credentials are missing
   - Could indicate staging environment secrets are missing or expired

### Medium Probability

3. **Data Validation Failure**
   - Schema validation may be failing on corrupted or changed API response
   - Parliament may have changed their data format

4. **Network/DNS Resolution Issue**
   - GitHub Actions runner may have had temporary network issues

### Low Probability

5. **Bun Runtime Issue**
   - Version incompatibility or runtime bug
   - Both runs used `bun-version: latest`

6. **Code Regression**
   - Recent changes to staging branch affecting sync logic
   - Last staging commit was E2E tests (unlikely to affect sync)

---

## Required Actions for Root Cause Confirmation

### Immediate Actions

1. **Install and authenticate GitHub CLI** to access full workflow logs:
   ```bash
   brew install gh
   gh auth login
   gh run view 20772339098 --log
   ```

2. **Test Parliament API availability**:
   ```bash
   # Test one of the dataset URLs directly
   curl -I "https://app.parlamento.pt/webutils/docs/doc.txt?path=..."
   ```

3. **Verify staging environment secrets** in GitHub Settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET`
   - `SENTRY_DSN`

### Investigation Commands

```bash
# View full logs (requires gh CLI + authentication)
gh run view 20772339098 --log

# List recent sync-data runs
gh run list --workflow=sync-data.yml --limit 10

# Check staging environment secrets exist
gh secret list --env staging

# Re-run the failed workflow
gh run rerun 20772339098
```

---

## Log Access Limitation

**Note:** Full workflow logs could not be retrieved via the GitHub API due to authentication requirements:

```json
{
  "message": "Must have admin rights to Repository.",
  "documentation_url": "https://docs.github.com/rest/actions/workflow-jobs#download-job-logs-for-a-workflow-run",
  "status": "403"
}
```

The `gh` CLI tool is not available in the current environment. Full root cause confirmation requires either:
1. Installing and authenticating `gh` CLI
2. Manual inspection of logs via GitHub web UI
3. Repository admin providing log excerpts

---

## Preliminary Hypothesis

Based on the short execution time (~6 seconds), the failure likely occurred early in the sync process, most probably during:

1. **Parliament API fetch phase** - One or more dataset URLs returning errors
2. **Supabase client initialization** - Missing/invalid environment credentials

The fact that both staging AND production failed with identical patterns strongly suggests an **external dependency issue** (Parliament API) rather than an environment-specific configuration problem.

---

## Recent Code Changes Analysis

This section documents the analysis of recent commits to identify any changes that may have caused the sync failure.

### Commit Analysis Window: Last 7 Days (2025-12-31 to 2026-01-07)

**Command executed:**
```bash
git log --since='7 days ago' --oneline --name-only -- .github/workflows apps/watcher
```

**Result:** Only **1 commit** affected the workflows directory:

| Commit | Message | Files Modified | Relevant to Failure? |
|--------|---------|----------------|---------------------|
| `0b94dbb` | ci: add supabase stop before start to prevent port conflicts | `.github/workflows/ci.yml` | ❌ No - CI workflow, not sync |

### Sync Workflow History (Last 14 Days)

**Command executed:**
```bash
git log --since='14 days ago' --oneline --name-only -- .github/workflows/sync-data.yml .github/workflows/sync-photos.yml
```

**Result:** The last changes to sync workflows were **14+ days ago**:

| Commit | Message | Files Modified |
|--------|---------|----------------|
| `5034d4a` | feat(workflow): add standalone photo sync workflow | `sync-photos.yml` |
| `390a548` | feat(workflow): add photo sync option to sync-data workflow | `sync-data.yml` |
| `92bcde5` | ci: simplify workflows from 7 to 4 | `sync-data.yml` |

**Key Finding:** No changes to `sync-data.yml` or `sync-photos.yml` in the last 7 days. The workflows have been stable.

### Watcher Service Changes (Last 14 Days)

**Most recent watcher changes:**

| Commit | Message | Key Files |
|--------|---------|-----------|
| `ae442ce` | fix(data): ensure only current legislature (XVII) data is used | `config.ts`, `attendance.ts` |
| `a7ab734` | fix(watcher): preserve Supabase Storage photo URLs during deputy sync | `transform.ts` |
| `48a186b` | fix(watcher): extract deputy photos from CSS background-image | `biography.ts` |
| `ad79f86` | fix(watcher): fix oneOf schema validation for AutoresGP field | `atividades.schema.json` |
| `7dbf0cb` | fix(watcher): make JSON schemas more permissive for Parliament API data | Multiple schemas |

**Note:** These changes were made more than 7 days ago and the sync workflow has run successfully since then.

### Cross-Branch Commit Analysis

When examining commits across all branches (including feature branches):

```bash
git log --since='7 days ago' --oneline --all -- .github/workflows apps/watcher
```

Multiple feature branches show activity, but the key findings are:
- Photo sync improvements (`feat(ci): run photo sync daily as part of data sync`)
- Postal code fixes unrelated to sync logic
- CI optimization changes (parallel tests, caching)

**None of these changes are deployed to staging or production yet**, as they exist in feature branches.

### Conclusion: No Recent Code Changes as Root Cause

| Evidence | Verdict |
|----------|---------|
| No sync workflow changes in 7 days | ✅ Confirmed |
| No watcher code changes in 7 days | ✅ Confirmed |
| Both staging AND production failed | ✅ Identical pattern |
| Staging branch last commit: E2E tests | ✅ Unrelated to sync |
| Production using release tag v0.1.2 | ✅ No recent changes |

**Root cause is NOT a recent code change.** The identical failure in both environments with stable code strongly indicates:

1. **External API issue (Parliament data source)** - Most likely
2. **Supabase service degradation** - Possible
3. **Network/infrastructure issue** - Less likely

---

## Next Steps

1. [ ] Access full workflow logs to identify exact error message
2. [ ] Verify Parliament API endpoints are accessible
3. [ ] Check Supabase service status and credential validity
4. [ ] Compare with last successful run to identify what changed
5. [ ] Re-run workflow manually to test if issue persists

---

## Staging vs Production Workflow Configuration Comparison

This section documents the key differences between staging and production configurations across the sync-related workflows.

### 1. Sync Data Workflow (`sync-data.yml`)

#### Schedule Differences

| Aspect | Staging | Production |
|--------|---------|------------|
| **Cron Schedule** | `0 6 * * *` (6 AM UTC) | `0 7 * * *` (7 AM UTC) |
| **Trigger Method** | Scheduled + Manual + Called | Scheduled + Manual + Called |
| **Environment Detection** | Hour-based (`06` = staging) | Hour-based (`07` = production) |

#### Checkout Reference Strategy

| Aspect | Staging | Production |
|--------|---------|------------|
| **Branch/Tag** | `staging` branch (HEAD) | Latest release tag (e.g., `v0.1.2`) |
| **Source** | Direct branch checkout | Fetched via `github.rest.repos.listReleases()` |
| **Skip Logic** | Never skips | Skips if no releases exist |

**Key Finding:** This ref strategy means:
- **Staging** always runs the latest code from the `staging` branch
- **Production** runs the code from the most recent tagged release

This is a **safety mechanism** - production only runs tested, released code.

#### Environment Secrets (Both Environments)

| Secret | Purpose | Environment-Specific |
|--------|---------|---------------------|
| `B2_KEY_ID` | Backblaze B2 authentication | Yes (different credentials per environment) |
| `B2_APP_KEY` | Backblaze B2 authentication | Yes |
| `B2_BUCKET` | Target storage bucket | Yes (staging vs production bucket) |
| `SUPABASE_URL` | Supabase API endpoint | Yes (different Supabase projects) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access | Yes (different credentials) |
| `SENTRY_DSN` | Error tracking | Yes (different DSNs per environment) |

#### Production-Only Steps

| Step | Purpose | Why Production-Only |
|------|---------|---------------------|
| **Get latest release tag** | Determine which code version to run | Staging uses branch HEAD |
| **Skip if no release** | Graceful exit if no releases exist | Staging always has code to run |
| **Smoke test** | Verify Supabase data accessibility | Production needs post-sync validation |

**Production Smoke Test Secrets:**
- `SUPABASE_ANON_KEY` - Used to query `deputies` and `deputy_stats` tables via REST API

#### Cache Strategy

| Aspect | Staging | Production |
|--------|---------|------------|
| **Cache Key** | `sync-snapshots-staging-{run_id}` | `sync-snapshots-production-{run_id}` |
| **Restore Keys** | `sync-snapshots-staging-` | `sync-snapshots-production-` |

Environments have **isolated snapshot caches** to prevent cross-environment data contamination.

#### Failure Notification

| Aspect | Staging | Production |
|--------|---------|------------|
| **Issue Labels** | `bug`, `sync` | `bug`, `sync`, `production` |
| **Issue Title** | `Sync failed (staging) - {date}` | `Sync failed (production) - {date}` |

---

### 2. Sync Photos Workflow (`sync-photos.yml`)

| Aspect | Staging | Production |
|--------|---------|------------|
| **Trigger** | Manual only (`workflow_dispatch`) | Manual only (`workflow_dispatch`) |
| **Schedule** | None | None |
| **Checkout Ref** | `staging` branch | Latest release tag |
| **Secrets** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Same secret names, different values |
| **Failure Handling** | `core.setFailed()` if no releases | N/A for staging |

**Key Difference:** Unlike `sync-data.yml`, this workflow has **no scheduled runs** and requires manual triggering.

---

### 3. Release Production Workflow (`release-production.yml`)

This workflow is **production-only** and manages the release process:

| Step | Description |
|------|-------------|
| Checkout staging | Gets latest staging code with full git history |
| Verify CI passed | Checks required CI jobs completed successfully |
| Bump version | Updates `package.json` version via jq |
| Merge to main | Fast-forward merge staging → main |
| Create tag | Creates version tag (e.g., `v0.1.3`) |
| Push release | Pushes main branch and tag to remote |
| Create GitHub Release | Uses `softprops/action-gh-release@v2` |
| Deploy DB | Runs Supabase migrations in production |
| Trigger sync | Calls `sync-data.yml` with `environment=production` |

**Production-Specific Secrets:**

| Secret | Purpose |
|--------|---------|
| `DEPLOY_TOKEN` | Git operations with elevated permissions |
| `SUPABASE_PROJECT_ID` | Supabase project identifier for migrations |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication |
| `SUPABASE_DB_PASSWORD` | Database password for migrations |

---

### 4. Configuration Differences Summary Table

| Configuration | Staging | Production |
|--------------|---------|------------|
| **Code Source** | `staging` branch HEAD | Latest release tag |
| **Schedule** | 6 AM UTC | 7 AM UTC |
| **Smoke Tests** | No | Yes |
| **DB Migrations** | Via Vercel preview deploy | Via release workflow |
| **Cache Isolation** | Yes (separate cache keys) | Yes (separate cache keys) |
| **Failure Labels** | `bug`, `sync` | `bug`, `sync`, `production` |
| **Skip on No Release** | N/A | Yes |

---

### 5. Analysis: Configuration as Root Cause

Based on this comparison, the following configuration differences are **unlikely** to be the root cause of the failure:

| Potential Issue | Verdict | Reasoning |
|----------------|---------|-----------|
| **Different checkout refs** | ❌ Not cause | Both staging and production failed, so it's not ref-specific |
| **Different secrets** | ❔ Possible | If both environments share a dependency (e.g., Parliament API) |
| **Schedule timing** | ❌ Not cause | Runs are 1 hour apart but both failed identically |
| **Cache corruption** | ❌ Not cause | Caches are isolated per environment |
| **Missing secrets** | ❔ Possible | Would cause immediate failure for both environments |

**Conclusion:** The identical failure pattern in both environments strongly suggests the root cause is **not environment-specific configuration** but rather:
1. A shared external dependency failure (Parliament API)
2. A common code bug present in both staging branch and latest release
3. A Supabase service issue affecting both projects

---

## Appendix: API Response Data

### Workflow Run Metadata

```json
{
  "id": 20772339098,
  "name": "Sync Data",
  "status": "completed",
  "conclusion": "failure",
  "event": "schedule",
  "created_at": "2026-01-07T06:06:56Z",
  "updated_at": "2026-01-07T06:07:22Z"
}
```

### Failing Job Details

```json
{
  "id": 59650855517,
  "name": "sync",
  "status": "completed",
  "conclusion": "failure",
  "started_at": "2026-01-07T06:07:06Z",
  "completed_at": "2026-01-07T06:07:21Z"
}
```

### Issue #128

- **Title:** Sync failed (staging) - 2026-01-07
- **Created by:** github-actions[bot]
- **Created at:** 2026-01-07T06:07:19Z
- **Labels:** bug, sync
- **State:** open

---

## Staging Environment Secrets Validation

This section documents the required environment secrets for the staging sync workflow and provides verification methods.

### Required Secrets Summary

Based on analysis of `sync-data.yml` workflow and `apps/watcher/src/env.ts` validation logic:

| Secret | Required? | Used In | Failure Mode if Missing |
|--------|-----------|---------|------------------------|
| `SUPABASE_URL` | ✅ **REQUIRED** | env.ts validation, Supabase client | Process exits with "SUPABASE_URL is required" |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ **REQUIRED** | env.ts validation, Supabase client | Process exits with "SUPABASE_SERVICE_ROLE_KEY is required" |
| `B2_KEY_ID` | ⚠️ Optional | B2 archiving (snapshots) | Archiving disabled, sync continues |
| `B2_APP_KEY` | ⚠️ Optional | B2 archiving (snapshots) | Archiving disabled, sync continues |
| `B2_BUCKET` | ⚠️ Optional | B2 archiving (snapshots) | Archiving disabled, sync continues |
| `SENTRY_DSN` | ⚠️ Optional | Error tracking | Sentry disabled, sync continues |

### Critical: All-or-Nothing B2 Configuration

From `apps/watcher/src/env.ts` (lines 43-49):

```typescript
// B2 validation - all or nothing
const b2Vars = [process.env.B2_KEY_ID, process.env.B2_APP_KEY, process.env.B2_BUCKET];
const b2Defined = b2Vars.filter(Boolean).length;
if (b2Defined > 0 && b2Defined < 3) {
  errors.push(
    'B2 configuration incomplete: either set all B2_KEY_ID, B2_APP_KEY, B2_BUCKET or none'
  );
}
```

**Implication:** If staging has partial B2 configuration (1-2 of 3 vars), the sync will fail immediately with a clear error message.

### Expected Console Output on Secrets Issues

If secrets are missing, the env.ts validation would output:

```
❌ Environment validation failed:

   • SUPABASE_URL is required
   • SUPABASE_SERVICE_ROLE_KEY is required
```

**Key Finding:** The workflow run failed after 6 seconds in the "Sync data" step. If secrets were completely missing, we would expect this type of clear validation error. The short execution time (6s) aligns with an early failure during either:
1. Environment validation (secrets issue)
2. Initial API request (Parliament API issue)

### Verification Methods

#### Method 1: GitHub CLI (Requires Authentication)

```bash
# Install and authenticate gh CLI
brew install gh
gh auth login

# List staging environment secrets
gh secret list --env staging

# Expected output should include:
# B2_APP_KEY        Updated 2026-XX-XX
# B2_BUCKET         Updated 2026-XX-XX
# B2_KEY_ID         Updated 2026-XX-XX
# SENTRY_DSN        Updated 2026-XX-XX
# SUPABASE_SERVICE_ROLE_KEY  Updated 2026-XX-XX
# SUPABASE_URL      Updated 2026-XX-XX
```

#### Method 2: GitHub Web Interface (Manual)

1. Navigate to: https://github.com/bcamarneiro/adamastor/settings/environments
2. Select "staging" environment
3. Under "Environment secrets", verify all required secrets exist:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ `B2_KEY_ID` (optional)
   - ⚠️ `B2_APP_KEY` (optional)
   - ⚠️ `B2_BUCKET` (optional)
   - ⚠️ `SENTRY_DSN` (optional)

#### Method 3: Check Full Workflow Logs

The full workflow logs (accessible via `gh run view 20772339098 --log`) would show:
- If secrets missing: "❌ Environment validation failed" with specific missing vars
- If secrets valid: "🔧 Environment: staging" followed by Supabase URL confirmation

### Analysis: Are Missing Secrets the Root Cause?

| Evidence | Supports Missing Secrets? | Reasoning |
|----------|---------------------------|-----------|
| Both staging AND production failed | ❌ **No** | Production uses different secrets; both failing suggests shared dependency |
| Short execution time (6s) | ❔ Maybe | Could be secrets OR early API failure |
| Step 8 "Sync data" failed | ❔ Maybe | Env validation happens at start of this step |
| No changes to workflows in 7 days | ❔ Maybe | Secrets could have been rotated externally |
| Production smoke test has `SUPABASE_ANON_KEY` | ✅ Partial | Shows production has additional secrets configured |

### Verification Status

| Item | Status | Notes |
|------|--------|-------|
| Code analysis of required secrets | ✅ Complete | Documented in env.ts |
| Workflow secret references | ✅ Complete | Documented from sync-data.yml |
| gh CLI verification | ⏳ **Blocked** | gh CLI not available in current environment |
| GitHub web verification | ⏳ **Requires manual action** | Admin access to repository settings needed |

### Recommendations

1. **Immediate:** Use GitHub web interface to verify all required secrets exist in staging environment
2. **If secrets are present:** Focus investigation on Parliament API availability (most likely cause given both environments failed)
3. **If secrets are missing:** Add the missing secrets and re-run the workflow
4. **Future:** Add a pre-sync step that validates environment before attempting sync to provide clearer error messages

### Production Environment Comparison

For reference, production workflow also uses additional secrets:
- `SUPABASE_ANON_KEY` - Used in smoke tests (production only)
- `DEPLOY_TOKEN` - Used in release workflow (not sync)

---

*Investigation document created by auto-claude agent on 2026-01-07*
