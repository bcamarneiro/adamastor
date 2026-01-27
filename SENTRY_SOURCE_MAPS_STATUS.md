# Sentry Source Maps - Implementation Status

## Summary

✅ **Sentry source maps are FULLY IMPLEMENTED and ready for production use.**

All code changes and documentation are complete. The only remaining step is to configure environment variables in Vercel (which requires repository owner access).

---

## What's Already Implemented

### 1. Package Installation ✅

**File**: `apps/web/package.json`

The Sentry Vite plugin is already installed:

```json
"devDependencies": {
  "@sentry/vite-plugin": "^3.2.4",
  // ...
}
```

### 2. Vite Configuration ✅

**File**: `apps/web/vite.config.ts`

Source maps and Sentry plugin are already configured:

```typescript
export default defineConfig({
  build: {
    sourcemap: true,  // ✅ Source maps enabled
  },
  plugins: [
    react(),
    tailwindcss(),
    // ✅ Sentry source map upload configured
    process.env.NODE_ENV === 'production' &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ].filter(Boolean),
});
```

**Key Features**:
- Source maps are generated in production builds
- Sentry plugin only runs in production (`NODE_ENV === 'production'`)
- Uses environment variables for configuration
- Plugin is properly filtered to avoid null values

### 3. Sentry SDK Configuration ✅

**File**: `apps/web/src/lib/sentry.ts`

Sentry is initialized with:
- DSN from `VITE_SENTRY_DSN` environment variable
- Performance monitoring (10% sample rate)
- Session replay on errors
- Proper environment detection

### 4. Environment Variables Documentation ✅

**File**: `apps/web/.env.example`

All required environment variables are documented:

```bash
# Runtime DSN (client-side)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Environment identifier
VITE_ENVIRONMENT=local

# Build-time variables (for source map uploads)
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**File**: `docs/GITHUB-SECRETS.md`

Comprehensive documentation includes:
- Detailed explanation of each environment variable
- Step-by-step Vercel configuration instructions
- How to create Sentry auth tokens with correct scopes
- Security notes about marking `SENTRY_AUTH_TOKEN` as sensitive
- Verification steps to confirm source maps are working

---

## What Needs to Be Configured (Repository Owner Only)

### Vercel Environment Variables

The repository owner needs to add these variables to Vercel (Production environment):

| Variable | Value | Environment | Sensitive |
|----------|-------|-------------|-----------|
| `VITE_SENTRY_DSN` | Your Sentry DSN | Production | No |
| `SENTRY_AUTH_TOKEN` | Your auth token | Production | **Yes** |
| `SENTRY_ORG` | Your org slug | Production | No |
| `SENTRY_PROJECT` | Your project slug | Production | No |

### How to Configure (for Repository Owner)

Follow the instructions in `docs/GITHUB-SECRETS.md`, section "For Web App (Vercel)" → "For Source Map Uploads (Web App)".

Quick summary:
1. Go to Vercel Dashboard → Select project → Settings → Environment Variables
2. Add each variable listed above
3. For `SENTRY_AUTH_TOKEN`: **Check the "Sensitive" checkbox**
4. Deploy and verify in build logs

---

## Verification Steps

After configuring environment variables and deploying:

1. **Build Logs**: Check that build logs show "Uploading source maps to Sentry"
2. **Sentry Dashboard**: Go to Sentry → Releases → Verify artifacts are uploaded
3. **Error Testing**: Trigger a test error in production and verify stack traces show original TypeScript file paths (e.g., `src/App.tsx:42`) instead of minified code

---

## Technical Details

### How It Works

1. **Development**: 
   - Source maps are generated but NOT uploaded
   - Sentry plugin is disabled (not production)
   - Errors are not sent to Sentry

2. **Production Build**:
   - Vite generates source maps (`build.sourcemap: true`)
   - Sentry plugin uploads source maps to Sentry servers
   - Uploaded maps are associated with the release/commit

3. **Production Runtime**:
   - Errors are captured by Sentry SDK
   - Sentry matches minified stack traces to source maps
   - Developers see readable stack traces with original file paths

### Security Considerations

✅ **Safe**:
- `VITE_SENTRY_DSN` is public (client-side)
- Source maps are uploaded to Sentry (not exposed to users)
- Build-time variables are only used during build

✅ **Protected**:
- `SENTRY_AUTH_TOKEN` must be marked as "Sensitive" in Vercel
- Auth token never appears in client-side code
- Source maps are stored securely on Sentry servers

---

## References

- **Sentry Vite Plugin Docs**: https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/
- **Environment Variables**: `apps/web/.env.example`
- **Deployment Guide**: `docs/GITHUB-SECRETS.md`
- **Sentry Configuration**: `apps/web/src/lib/sentry.ts`
- **Vite Configuration**: `apps/web/vite.config.ts`

---

## Conclusion

✅ All code implementation is complete  
✅ All documentation is complete  
⏳ Waiting for Vercel environment variable configuration (repository owner action)

Once the environment variables are configured in Vercel, source maps will automatically upload on the next production deployment, making production errors much easier to debug.
