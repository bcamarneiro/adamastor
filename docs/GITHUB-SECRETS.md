# GitHub Secrets Configuration

This document lists all secrets required for the GitHub Actions workflows to function properly.

## Required Secrets by Environment

### Staging Environment

Configure these in **Settings > Environments > staging > Environment secrets**:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL for staging | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (NOT anon key) | `eyJhbG...` |
| `SUPABASE_PROJECT_ID` | Project reference ID (from URL) | `abc123xyz` |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for CLI | `sbp_...` |

### Production Environment

Configure these in **Settings > Environments > production > Environment secrets**:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL for production | `https://xyz789.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (NOT anon key) | `eyJhbG...` |
| `SUPABASE_PROJECT_ID` | Project reference ID (from URL) | `xyz789abc` |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for CLI | `sbp_...` |

## Optional Secrets (B2 Archiving)

If you want to enable Backblaze B2 archiving for raw data snapshots:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `B2_KEY_ID` | B2 Application Key ID | `0012345...` |
| `B2_APP_KEY` | B2 Application Key | `K001abc...` |
| `B2_BUCKET` | B2 Bucket name | `parl-watch-archive` |

> **Note:** B2 secrets must ALL be set or NONE. Partial configuration will cause validation errors.

## Optional Secrets (Error Tracking)

Sentry is used for error tracking in both the watcher (backend) and web app (frontend).

### For Watcher (GitHub Actions)

Add to environment secrets (staging/production):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SENTRY_DSN` | Sentry DSN for the watcher project | `https://abc123@o123.ingest.sentry.io/456` |

### For Web App (Vercel)

Add these as Vercel environment variables (not GitHub secrets):

#### Runtime Variables (Client-Side)

| Variable Name | Description | Example | Sensitive |
|---------------|-------------|---------|-----------|
| `VITE_SENTRY_DSN` | Sentry DSN for the web app | `https://xyz789@o123.ingest.sentry.io/789` | No |
| `VITE_ENVIRONMENT` | Environment identifier | `production` or `staging` | No |

#### Build-Time Variables (Source Map Uploads)

These variables are required for Sentry source map uploads during production builds, enabling readable stack traces in production error reports.

| Variable Name | Description | Example | Sensitive |
|---------------|-------------|---------|-----------|
| `SENTRY_AUTH_TOKEN` | Auth token for source map uploads | `sntrys_eyJ...` | **Yes** |
| `SENTRY_ORG` | Sentry organization slug | `my-org` | No |
| `SENTRY_PROJECT` | Sentry project slug | `adamastor-web` | No |

> **Security Note:** `SENTRY_AUTH_TOKEN` must be marked as "Sensitive" in Vercel to prevent it from being exposed in build logs.

> **Note:** Sentry is automatically disabled if the DSN is not set. This is fine for local development. Source map uploads only occur during production builds.

## Repository-Level Secrets

These are used across all workflows:

| Secret Name | Description | Used By |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token for deployments | Web app deployment |
| `VERCEL_ORG_ID` | Vercel organization ID | Web app deployment |
| `VERCEL_PROJECT_ID` | Vercel project ID | Web app deployment |

## How to Get These Values

### Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the **Project URL** for `SUPABASE_URL`
4. Copy the **service_role** key (under "Project API keys") for `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings > General** and copy the **Reference ID** for `SUPABASE_PROJECT_ID`
6. Go to [Account Tokens](https://supabase.com/dashboard/account/tokens) and generate a token for `SUPABASE_ACCESS_TOKEN`

> **Security Warning:** The service role key bypasses Row Level Security. Never expose it client-side.

### Vercel

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token for `VERCEL_TOKEN`
3. For org/project IDs, run `vercel link` in the project directory, then check `.vercel/project.json`

### Backblaze B2 (Optional)

1. Go to [Backblaze B2 Console](https://secure.backblaze.com/b2_buckets.htm)
2. Create a bucket (or use existing)
3. Go to **App Keys** and create a new application key
4. Copy the `keyID` and `applicationKey`

### Sentry (Optional)

1. Go to [Sentry](https://sentry.io) and create an account/organization
2. Create **two projects**:
   - One for the watcher (Node.js platform)
   - One for the web app (React platform)
3. For each project, go to **Settings > Client Keys (DSN)** and copy the DSN
4. Add the watcher DSN as `SENTRY_DSN` in GitHub environment secrets
5. Add the web app DSN as `VITE_SENTRY_DSN` in Vercel environment variables

#### For Source Map Uploads (Web App)

To enable readable stack traces in production errors, configure source map uploads:

1. Go to [Sentry Account Settings > Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Click **Create New Token**
3. Select the following scopes:
   - `project:releases` (required for uploading source maps)
   - `org:read` (required for organization access)
4. Copy the generated token for `SENTRY_AUTH_TOKEN`
5. Find your organization and project slugs from the Sentry URL:
   - URL format: `https://sentry.io/organizations/<SENTRY_ORG>/projects/<SENTRY_PROJECT>/`
   - Example: `https://sentry.io/organizations/my-org/projects/adamastor-web/`
6. Add these variables to Vercel:
   - `SENTRY_AUTH_TOKEN` - mark as **Sensitive**
   - `SENTRY_ORG` - your organization slug
   - `SENTRY_PROJECT` - your project slug

### Vercel Dashboard Configuration (Step-by-Step)

Follow these steps to configure Sentry source map environment variables in Vercel:

1. **Navigate to your Vercel project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project (e.g., `adamastor`)

2. **Open Environment Variables settings**
   - Click on **Settings** tab
   - Select **Environment Variables** from the sidebar

3. **Add the required variables** (one at a time):

   | Variable | Value | Environments | Sensitive |
   |----------|-------|--------------|-----------|
   | `VITE_SENTRY_DSN` | Your Sentry DSN | Production | No |
   | `SENTRY_AUTH_TOKEN` | Your auth token | Production | **Yes** |
   | `SENTRY_ORG` | Your org slug | Production | No |
   | `SENTRY_PROJECT` | Your project slug | Production | No |

4. **For each variable:**
   - Enter the **Name** (e.g., `SENTRY_AUTH_TOKEN`)
   - Enter the **Value**
   - Select **Production** environment only (source maps are only needed for production)
   - For `SENTRY_AUTH_TOKEN`: Check the **Sensitive** checkbox
   - Click **Save**

5. **Verify configuration**
   - Trigger a new production deployment
   - Check build logs for "Uploading source maps to Sentry" message
   - Navigate to Sentry dashboard > Releases to confirm artifacts appear

> **Tip:** After configuration, test by triggering an error in production and verifying the stack trace shows original TypeScript file paths (e.g., `src/App.tsx:42`) instead of minified code.

## Environment Setup Checklist

### For Staging

- [ ] Create `staging` environment in GitHub repo settings
- [ ] Add `SUPABASE_URL` secret
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Add `SUPABASE_PROJECT_ID` secret (for DB migrations)
- [ ] Add `SUPABASE_ACCESS_TOKEN` secret (for DB migrations)
- [ ] (Optional) Add `SENTRY_DSN` secret for error tracking
- [ ] (Optional) Add B2 secrets if archiving enabled

### For Production

- [ ] Create `production` environment in GitHub repo settings
- [ ] Add `SUPABASE_URL` secret (different project than staging!)
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Add `SUPABASE_PROJECT_ID` secret (for DB migrations)
- [ ] Add `SUPABASE_ACCESS_TOKEN` secret (for DB migrations)
- [ ] (Optional) Add `SENTRY_DSN` secret for error tracking
- [ ] (Optional) Enable "Required reviewers" for production approval gate
- [ ] (Optional) Add B2 secrets if archiving enabled

### For Web Deployment

- [ ] Add `VERCEL_TOKEN` as repository secret
- [ ] Add `VERCEL_ORG_ID` as repository secret
- [ ] Add `VERCEL_PROJECT_ID` as repository secret
- [ ] (Optional) Add `VITE_SENTRY_DSN` in Vercel environment variables
- [ ] (Optional) Add `VITE_ENVIRONMENT` in Vercel environment variables

### For Sentry Source Maps (Production Debugging)

Configure these in Vercel to enable readable production stack traces:

- [ ] Add `SENTRY_AUTH_TOKEN` in Vercel - mark as **Sensitive**
- [ ] Add `SENTRY_ORG` in Vercel
- [ ] Add `SENTRY_PROJECT` in Vercel
- [ ] Verify build logs show "Uploading source maps to Sentry"
- [ ] Verify Sentry dashboard shows uploaded artifacts under Releases

## Validation

The watcher validates environment variables at startup. If any required secrets are missing, you'll see an error like:

```text
❌ Environment validation failed:

   • SUPABASE_URL is required
   • SUPABASE_SERVICE_ROLE_KEY is required
```

## Workflow Reference

| Workflow | Environment | Secrets Used |
|----------|-------------|--------------|
| `sync.yml` | staging | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENTRY_DSN, B2_* |
| `sync-production.yml` | production | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENTRY_DSN, B2_* |
| `deploy-db.yml` | staging/production | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| `ci.yml` | none | none (uses local Supabase) |
