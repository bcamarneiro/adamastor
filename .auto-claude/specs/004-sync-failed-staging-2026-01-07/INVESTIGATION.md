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

## Next Steps

1. [ ] Access full workflow logs to identify exact error message
2. [ ] Verify Parliament API endpoints are accessible
3. [ ] Check Supabase service status and credential validity
4. [ ] Compare with last successful run to identify what changed
5. [ ] Re-run workflow manually to test if issue persists

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

*Investigation document created by auto-claude agent on 2026-01-07*
