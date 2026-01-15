# Deputy Photo URL Audit Report

## Date: 2026-01-15

## Executive Summary

Comprehensive audit of all deputy photo URLs in the Supabase database has been completed. All 242 active deputies in Legislature XVII (17) have correct photo URLs in the proper Parliament API format.

## Audit Findings

### Database State
- **Total deputies in database**: 1,446 (all legislatures)
- **Active deputies (Legislature XVII)**: 242
- **Deputies with null photo_url**: 0
- **Deputies with empty photo_url**: 0
- **Deputies with incorrect URL format**: 0

### URL Format Validation
- **Expected format**: `https://app.parlamento.pt/webutils/getimage.aspx?id={deputyId}&type=deputado`
- **All URLs match expected format**: ✅ YES (100%)
- **Non-Parliament URLs**: 0

## Conclusion

✅ **No action required** - All deputy photos already have correct URLs

The database is in excellent condition with all photo URLs properly formatted. The audit script created in `apps/watcher/src/audit-deputy-photos.ts` is available for future validation needs.

## Audit Script Usage

The audit script supports the following modes:

```bash
# Dry-run audit (no changes, checks all deputies)
bun run src/audit-deputy-photos.ts --dry-run

# Verbose mode (shows details for each deputy)
bun run src/audit-deputy-photos.ts --dry-run --verbose

# Fix mode (updates database with correct URLs)
bun run src/audit-deputy-photos.ts --fix

# Fix with verbose output
bun run src/audit-deputy-photos.ts --fix --verbose
```

## Script Features

The audit script (`audit-deputy-photos.ts`) provides:

1. **Comprehensive Auditing**
   - Queries all deputies from Supabase
   - Identifies missing photo URLs (null or empty)
   - Identifies incorrect URLs (wrong format)
   - Validates URLs return 200 status from Parliament API
   - Identifies unavailable photos (redirects or errors)

2. **Safety Features**
   - Dry-run mode by default (prevents accidental changes)
   - Validates URLs before updating database
   - Progress indicators for long-running audits
   - Detailed error reporting

3. **Reporting**
   - Summary statistics with percentages
   - Lists of deputies by issue type
   - HTTP status codes for unavailable photos
   - Execution time and rate estimates

## Recommendations

1. **Periodic Audits**: Run the audit script periodically (e.g., monthly) to ensure photo URLs remain valid
2. **Post-Sync Validation**: Run after deputy data synchronization to catch any issues
3. **Monitor Availability**: Track deputies with unavailable photos (status 302 or error)
4. **E2E Testing**: Implement E2E tests to verify photo display in the application (separate task)

## Technical Notes

### Photo URL Construction
The `getPhotoUrl(depId)` helper function in `apps/watcher/src/transform/deputies/helpers.ts` provides the canonical URL format:

```typescript
export function getPhotoUrl(depId: number): string {
  return `https://app.parlamento.pt/webutils/getimage.aspx?id=${depId}&type=deputado`;
}
```

### Database Schema
- **Table**: `deputies`
- **Column**: `photo_url` (string, nullable)
- **Key fields**: `id`, `name`, `external_id`, `photo_url`, `legislature`, `is_active`

### Validation Logic
The script validates URLs by:
1. Format check: Comparing with expected Parliament API URL
2. HTTP check: Sending HEAD request to verify 200 status
3. Redirect detection: Identifying 302 redirects to nophoto.jpg

## Related Issues

- Issue #36: Deputy photos not displaying
- Issue #156: Deputy Photo Audit & Fix (this task)

## Next Steps (Stream B & C)

- Stream B: E2E tests for photo display (`apps/web/e2e/deputy-photos.spec.ts`)
- Stream C: Manual verification in staging environment
- Stream C: Close Issue #36 with verification report
