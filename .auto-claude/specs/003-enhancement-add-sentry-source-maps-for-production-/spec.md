# Specification: Add Sentry Source Maps for Production Debugging

## Overview

Enable automatic source map uploads to Sentry during production builds to make error stack traces readable and debuggable. Currently, the Sentry SDK is configured and operational with ErrorBoundary and Session Replay, but production errors show minified/obfuscated code locations instead of original TypeScript source positions. This enhancement will integrate the `@sentry/vite-plugin` into the build pipeline and configure the necessary environment variables to enable source map uploads to Sentry during Vercel deployments.

## Workflow Type

**Type**: feature

**Rationale**: This task adds new build-time tooling and capabilities to the existing Sentry integration. While Sentry runtime monitoring already exists, we're implementing a new feature (source map upload mechanism) that requires package installation, build configuration changes, and environment setup across development and production environments.

## Task Scope

### Services Involved
- **web** (primary) - Frontend React application requiring source map uploads for production error debugging
- **Vercel** (infrastructure) - Deployment platform requiring environment variable configuration

### This Task Will:
- [x] Install `@sentry/vite-plugin` package in the web application
- [x] Configure the Sentry Vite plugin in `vite.config.ts` for production builds
- [x] Add `VITE_SENTRY_DSN` environment variable to Vercel deployment settings
- [x] Add `SENTRY_AUTH_TOKEN` for build-time authentication with Sentry API
- [x] Configure plugin to upload source maps only during production builds
- [x] Verify source maps appear in Sentry dashboard after deployment
- [x] Ensure production error stack traces show original source code locations

### Out of Scope:
- Modifying existing Sentry SDK runtime configuration
- Changing ErrorBoundary or Session Replay behavior
- Adding new Sentry features beyond source map uploads
- Modifying Sentry configuration for other services (watcher)
- Creating custom source map generation logic (using Vite's built-in capabilities)

## Service Context

### web

**Tech Stack:**
- Language: TypeScript
- Framework: React
- Build Tool: Vite
- Styling: Tailwind CSS
- State Management: Zustand
- Testing: Vitest
- E2E Testing: Playwright
- Package Manager: npm

**Key directories:**
- `src/` - Source code
- `src/lib/` - Library utilities and service configurations

**Entry Point:** `src/App.tsx`

**How to Run:**
```bash
cd apps/web
npm run dev
```

**Port:** 3000

**Current Sentry Integration:**
- SDK Package: `@sentry/react` (already installed)
- Configuration File: `src/lib/sentry.ts`
- Features: ErrorBoundary, Session Replay
- Missing: Source map uploads

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `apps/web/package.json` | web | Add `@sentry/vite-plugin` to devDependencies |
| `apps/web/vite.config.ts` | web | Import and configure Sentry plugin with conditional production-only execution |
| `apps/web/.env.example` | web | Add `VITE_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` placeholders for documentation |
| Vercel Dashboard | infrastructure | Add `VITE_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` environment variables |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `apps/web/src/lib/sentry.ts` | Existing Sentry configuration structure (initialization, options, DSN usage) |
| `apps/web/vite.config.ts` | Current Vite plugin configuration pattern (how plugins are imported and configured) |

## Patterns to Follow

### Existing Sentry Configuration Pattern

From `apps/web/src/lib/sentry.ts`:

```typescript
// Expected pattern for Sentry initialization
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    // ErrorBoundary integration
    // Session Replay integration
  ],
  // Additional configuration options
});
```

**Key Points:**
- DSN is loaded from environment variable `VITE_SENTRY_DSN`
- Uses Vite's `import.meta.env` for environment variable access
- Configuration is centralized in lib/sentry.ts

### Vite Plugin Configuration Pattern

Expected pattern in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Conditionally add Sentry plugin only for production builds
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ].filter(Boolean), // Remove falsy values
  build: {
    sourcemap: true, // Enable source map generation
  },
});
```

**Key Points:**
- Plugin should only run during production builds (conditional check)
- Requires authentication token from environment
- Needs Sentry organization and project identifiers
- Must enable sourcemap generation in build config
- Use `.filter(Boolean)` to remove conditional false values from plugins array

## Requirements

### Functional Requirements

1. **Source Map Upload During Build**
   - Description: Automatically upload generated source maps to Sentry during Vercel production builds
   - Acceptance: Build logs show successful source map upload to Sentry, Sentry dashboard displays uploaded artifacts

2. **Readable Production Stack Traces**
   - Description: Production errors in Sentry should display original TypeScript source code locations instead of minified code
   - Acceptance: Trigger a test error in production, verify stack trace shows original file paths and line numbers (e.g., `App.tsx:42` instead of `bundle.js:1234`)

3. **Environment Variable Configuration**
   - Description: Add missing `VITE_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to Vercel deployment environment
   - Acceptance: Vercel dashboard shows both variables configured for production environment, build process can access them

4. **Production-Only Execution**
   - Description: Source map uploads should only occur during production builds, not development or preview builds
   - Acceptance: Local `npm run dev` does not attempt uploads, Vercel production builds show upload activity

### Non-Functional Requirements

1. **Build Performance**
   - Description: Source map upload should not significantly increase build time
   - Acceptance: Production build time increases by less than 30 seconds

2. **Security**
   - Description: Sensitive tokens must not be exposed in client-side code or public repositories
   - Acceptance: `SENTRY_AUTH_TOKEN` only used at build time, not included in client bundle; no tokens committed to Git

3. **Backward Compatibility**
   - Description: Existing Sentry runtime functionality must remain operational
   - Acceptance: ErrorBoundary and Session Replay continue working after plugin integration

### Edge Cases

1. **Missing Environment Variables** - Plugin should gracefully handle missing `SENTRY_AUTH_TOKEN` in development, log warning instead of failing build
2. **Upload Failures** - If Sentry API is unreachable, build should complete successfully with warning (not block deployment)
3. **Large Source Maps** - Handle projects with large bundle sizes without timeout issues during upload
4. **Monorepo Source Paths** - Ensure source maps correctly map to monorepo file structure (`apps/web/src/...`)

## Implementation Notes

### DO
- Install `@sentry/vite-plugin` as a devDependency in `apps/web/package.json`
- Use conditional logic (`process.env.NODE_ENV === 'production'`) to only activate plugin in production
- Enable `sourcemap: true` in Vite build configuration
- Configure plugin with organization and project identifiers from environment variables
- Add comprehensive environment variable documentation to `.env.example`
- Test source map uploads in a Vercel preview deployment before merging to production
- Verify existing Sentry runtime features still work after integration

### DON'T
- Don't hardcode Sentry credentials in vite.config.ts or commit them to Git
- Don't enable source map uploads for development or preview environments (cost and unnecessary)
- Don't expose the `SENTRY_AUTH_TOKEN` in client-side code (it's build-time only)
- Don't modify the existing `apps/web/src/lib/sentry.ts` runtime configuration
- Don't include source maps in the production client bundle (they should only be uploaded to Sentry)
- Don't create custom source map generation logic when Vite provides it built-in

## Development Environment

### Start Services

```bash
# Install dependencies (run from project root)
npm install

# Start web application
cd apps/web
npm run dev
```

### Service URLs
- Web Application: http://localhost:3000

### Required Environment Variables

**Development (.env.local):**
```bash
# Runtime Sentry DSN (client-side)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional for local builds (not needed for dev server)
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**Production (Vercel Dashboard):**
```bash
# Required for runtime Sentry SDK
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Required for build-time source map uploads
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**How to Obtain:**
- `VITE_SENTRY_DSN`: Sentry Project Settings → Client Keys (DSN)
- `SENTRY_AUTH_TOKEN`: Sentry Account Settings → Auth Tokens → Create New Token (scopes: `project:releases`, `org:read`)
- `SENTRY_ORG`: Your Sentry organization slug (visible in Sentry URL)
- `SENTRY_PROJECT`: Your project slug (visible in Sentry URL)

## Success Criteria

The task is complete when:

1. [x] `@sentry/vite-plugin` is installed in `apps/web/package.json` devDependencies
2. [x] `vite.config.ts` includes Sentry plugin configuration with production-only conditional
3. [x] `VITE_SENTRY_DSN` is configured in Vercel production environment
4. [x] `SENTRY_AUTH_TOKEN` is configured in Vercel production environment (with appropriate scopes)
5. [x] Production build logs on Vercel show successful source map upload to Sentry
6. [x] Sentry dashboard displays uploaded source maps for the latest production release
7. [x] Test production error shows readable stack trace with original TypeScript file paths and line numbers
8. [x] No console errors in browser or build logs
9. [x] Existing Sentry features (ErrorBoundary, Session Replay) continue working
10. [x] Local development builds do not attempt source map uploads
11. [x] `.env.example` documents all required Sentry environment variables

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Vite Config Validation | `apps/web/vite.config.ts` | Configuration syntax is valid, plugins array properly structured |
| Environment Variable Loading | Manual verification | All required env vars load correctly in build environment |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Sentry Plugin Integration | web ↔ Sentry API | Plugin successfully authenticates and uploads source maps during production build |
| Build Pipeline | web ↔ Vercel | Production deployment completes successfully with plugin active |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Production Error Reporting | 1. Deploy to production with plugin 2. Trigger test error 3. Check Sentry dashboard | Stack trace shows `App.tsx:42` instead of minified code, source code snippet visible in Sentry UI |
| Development Build | 1. Run `npm run dev` locally 2. Check console output | No Sentry upload attempts, no errors related to missing auth token |
| Preview Deployment | 1. Deploy to Vercel preview environment 2. Check build logs | Source maps optionally uploaded (depending on configuration), build succeeds |

### Browser Verification (if frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| Application Load | `http://localhost:3000` (dev) | No console errors, Sentry initializes correctly |
| Production Build | Vercel production URL | Application loads, no build artifacts exposed |

### Build Verification
| Check | Command | Expected |
|-------|---------|----------|
| Plugin Installation | `cat apps/web/package.json \| grep sentry/vite-plugin` | Package appears in devDependencies |
| Build Success | `cd apps/web && npm run build` | Build completes successfully, sourcemaps generated |
| Vercel Build Logs | Check Vercel deployment logs | Log contains "Uploading source maps to Sentry" or similar success message |
| Sentry Dashboard | Navigate to Sentry Releases | Latest release shows uploaded artifacts (source maps) |

### Environment Variable Verification
| Check | Location | Expected |
|-------|----------|----------|
| Vercel Production Env | Vercel Dashboard → Settings → Environment Variables | `VITE_SENTRY_DSN` present |
| Vercel Production Env | Vercel Dashboard → Settings → Environment Variables | `SENTRY_AUTH_TOKEN` present (marked as sensitive) |
| Documentation | `apps/web/.env.example` | Both variables documented with example values |

### QA Sign-off Requirements
- [x] `@sentry/vite-plugin` successfully installed without dependency conflicts
- [x] `vite.config.ts` syntax validated (no TypeScript errors)
- [x] Production build completes successfully with Sentry plugin active
- [x] Build logs confirm source map upload to Sentry
- [x] Sentry dashboard displays uploaded source maps for production release
- [x] Test production error shows readable stack trace with original source paths
- [x] Development builds do not attempt uploads (verified in console)
- [x] Environment variables properly configured in Vercel
- [x] No exposure of sensitive tokens in client-side code
- [x] No regressions: ErrorBoundary still catches errors
- [x] No regressions: Session Replay still records sessions
- [x] Code follows established Vite configuration patterns
- [x] No security vulnerabilities introduced (tokens handled securely)
- [x] Build performance acceptable (upload adds < 30s to build time)

## Implementation Strategy

### Phase 1: Local Setup & Configuration
1. Install `@sentry/vite-plugin` package
2. Configure plugin in `vite.config.ts` with production conditionals
3. Test local production build (`npm run build`)
4. Document environment variables in `.env.example`

### Phase 2: Environment Configuration
1. Obtain Sentry auth token with required scopes
2. Add `VITE_SENTRY_DSN` to Vercel production environment
3. Add `SENTRY_AUTH_TOKEN` to Vercel production environment
4. Add `SENTRY_ORG` and `SENTRY_PROJECT` to Vercel production environment

### Phase 3: Deployment & Verification
1. Deploy to Vercel preview environment for testing
2. Verify source map upload in preview build logs
3. Check Sentry dashboard for uploaded artifacts
4. Trigger test error, verify stack trace readability
5. Merge to production after successful preview validation

### Phase 4: QA & Documentation
1. Run full QA checklist
2. Verify no regressions in existing Sentry features
3. Document troubleshooting steps for common issues
4. Update team documentation with new environment variables

## Risk Assessment

### High Risk
- **Token Security**: Exposing `SENTRY_AUTH_TOKEN` in client code would compromise Sentry account
  - Mitigation: Keep token build-time only, never reference in runtime code, mark as sensitive in Vercel

### Medium Risk
- **Build Failures**: Plugin configuration errors could block deployments
  - Mitigation: Test thoroughly in preview environment, use conditional plugin loading with fallback
- **Upload Timeouts**: Large source maps could timeout during upload
  - Mitigation: Configure reasonable timeout values, ensure build completes even if upload fails

### Low Risk
- **Performance Impact**: Source map upload adds time to builds
  - Mitigation: Acceptable trade-off for production debugging capability, happens only at deploy time
- **Cost**: Sentry API usage for uploads
  - Mitigation: Only upload on production builds, not preview/dev

## Troubleshooting Guide

### Source Maps Not Appearing in Sentry
1. Check build logs for upload confirmation
2. Verify `SENTRY_AUTH_TOKEN` has correct scopes (`project:releases`, `org:read`)
3. Confirm `SENTRY_ORG` and `SENTRY_PROJECT` match Sentry dashboard values
4. Check Sentry project settings allow source map uploads

### Build Failures After Plugin Addition
1. Verify plugin is conditionally loaded only in production
2. Check all environment variables are set in Vercel
3. Review build logs for specific error messages
4. Temporarily disable plugin to isolate issue

### Stack Traces Still Minified
1. Confirm source maps uploaded to correct Sentry release
2. Check release version matches deployed code
3. Verify `sourcemap: true` in Vite build config
4. Inspect uploaded artifacts in Sentry dashboard

### Local Development Errors
1. Ensure plugin only runs when `NODE_ENV === 'production'`
2. Verify `.filter(Boolean)` removes falsy plugin values
3. Check local `.env.local` has `VITE_SENTRY_DSN` (runtime) but token not required for dev server
