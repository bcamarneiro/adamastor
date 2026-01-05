## Summary

<!-- One sentence describing what this PR does -->

## Context / Motivation

<!-- Why is this change needed? Link related issues or discussions. -->

## Implementation Details

<!-- How does this work? Key design decisions, trade-offs, alternatives considered. -->

## Affected Apps/Packages

<!-- Check all that apply -->
- [ ] `apps/watcher` (data pipeline)
- [ ] `apps/web` (React frontend)
- [ ] `packages/shared` (shared types)
- [ ] `supabase/` (database migrations)
- [ ] Root (tooling, CI, docs)

## Risks / Trade-offs

<!-- 
- Breaking changes? (API contracts, database schema, shared types)
- Performance impact?
- Data consistency concerns?
- Migration requirements?
-->

## Testing

<!-- What was tested? Test coverage added? -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if UI changes)
- [ ] Manual testing performed
- [ ] Tested in both apps (if touching `packages/shared/`)

**Test coverage:**
<!-- List new test files or describe test scenarios -->

## Related Issues

Fixes #

## Checklist

- [ ] Branched from `staging` (not `main`)
- [ ] `bun lint` passes
- [ ] `bun typecheck` passes
- [ ] `bun test` passes
- [ ] `bun --filter '*' build` passes (if applicable)
- [ ] Manually tested locally
- [ ] Documentation updated (if needed)
- [ ] No secrets or sensitive data committed

## Screenshots

<!-- If UI changes, include before/after screenshots -->

---

## For AI Reviewers (GitHub Copilot Reviews)

<!-- Help AI reviewers understand the change -->

**Key areas to review:**
<!-- Highlight specific files or logic that needs careful review -->

**Potential concerns:**
<!-- Any areas where you're uncertain or want extra scrutiny -->
