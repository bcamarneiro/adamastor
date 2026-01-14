# Auto-Claude Configuration for Adamastor

This file provides instructions for Auto-Claude agents working on Adamastor issues.

## Critical Rules

1. **Branch from staging** - All branches MUST be created from `staging`, never from `main`
2. **PRs target staging** - All pull requests MUST target `staging`, never `main`
3. **Regression tests required** - Every bug fix MUST include an E2E regression test
4. **Reply to all PR comments** - Never leave review comments without responses
5. **Wait for CI** - Do not request review until all CI checks are green

## Complete Workflow

### 1. Branch Creation
```bash
git checkout staging
git pull origin staging
git checkout -b <type>/issue-<number>-<short-description>
```
- Types: `fix/`, `feat/`, `refactor/`, `docs/`, `chore/`
- Example: `fix/issue-42-district-filter`

### 2. Issue Comment
Post a comment on the issue stating:
- What you're working on
- Your planned approach
- Any questions or clarifications

### 3. Implementation
- Read relevant files
- Reproduce the problem (for bugs)
- Implement the fix or feature
- Run tests: `bun run test`

### 4. E2E Regression Test (Bug Fixes Only)
**MANDATORY** for all bug fixes. Add test to appropriate spec file in `apps/web/e2e/`:
- `home.spec.ts` - Homepage bugs
- `navigation.spec.ts` - Navigation bugs
- `leaderboard.spec.ts` - Ranking page bugs
- `postal-codes.spec.ts` - Postal code bugs
- `parties.spec.ts` - Party page bugs

Pattern:
```typescript
// Issue #XX: Brief title
// @see https://github.com/bcamarneiro/adamastor/issues/XX
test('descriptive test name', async ({ page }) => {
  // Test the specific user flow that was broken
});
```

Test locally: `cd apps/web && npx playwright test <spec-file>`

### 5. Commit
Format: `<type>(<scope>): <description> (#<issue-number>)`
- Example: `fix(web): resolve district filter 400 error (#42)`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 6. Create PR
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

**CRITICAL**: Use `--base staging`, NOT `--base main`.

### 7. Wait for CI and Check for Copilot Comments

#### Step 7a: Wait for CI to complete

```bash
gh run watch <run-id>
```

- All checks must pass: lint, typecheck, test-watcher, test-web, e2e, build
- If CI fails, fix and push again

#### Step 7b: Check for GitHub Copilot review comments

**CRITICAL**: Before marking as ready for human review, check if Copilot already left comments:

```bash
# Check for any review comments
gh pr view <number> --json reviews,comments --jq '.reviews[], .comments[]'
```

If Copilot (or any automated reviewer) left comments:

1. Address ALL comments following step 8 below
2. Push fixes
3. Wait for CI to pass again
4. Verify all comments have replies
5. Only then mark as ready for human review

**Never send a PR to human review with:**

- ❌ Failing CI checks
- ❌ Unaddressed Copilot comments
- ❌ Review comments without replies

### 8. Address PR Review Comments
If the PR receives review comments (from Copilot or humans):

1. Check for comments:
   ```bash
   gh pr view <number> --comments
   ```

2. For each comment:
   - Make the fix if appropriate
   - Reply individually:
     ```bash
     gh api repos/bcamarneiro/adamastor/pulls/comments/<comment-id>/replies \
       -f body="Fixed in commit <sha>. <description>"
     ```
   - OR explain why not changing:
     ```bash
     gh api repos/bcamarneiro/adamastor/pulls/comments/<comment-id>/replies \
       -f body="Won't fix: <reasoning>"
     ```

3. After addressing all comments:
   - Push fixes
   - Wait for CI to pass
   - Re-request review:
     ```bash
     gh pr edit <number> --add-reviewer @bcamarneiro
     ```

**CRITICAL**: Every comment must receive a reply.

## Project Context

**What is Adamastor?**
Portuguese Parliament transparency platform tracking deputy attendance and performance.

**Tech Stack:**
- Monorepo with Turborepo
- Bun (watcher), Vite (web)
- TypeScript (strict mode)
- Testing: Bun test (watcher), Vitest + Playwright E2E (web)
- Database: Supabase (PostgreSQL)
- UI: React + Radix UI + Tailwind CSS
- Linting: Biome (not ESLint/Prettier)

**Key Files:**
- `apps/watcher/src/transform/` - Data pipeline (CRITICAL: affects data accuracy)
- `apps/web/e2e/*.spec.ts` - E2E regression tests
- `packages/shared/src/types.ts` - Shared TypeScript types
- `supabase/migrations/*.sql` - Database migrations

**Portuguese Context:**
- **Legislatura** - Legislative term (currently XVII/17th)
- **Deputado** - Deputy/MP
- **Distrito** - Electoral district (22 total)
- **Partido** - Political party (PS, PSD, CH, IL, BE, etc.)

## Common Pitfalls to Avoid

❌ Branching from `main` instead of `staging`
❌ Creating PRs to `main` instead of `staging`
❌ Forgetting E2E regression tests for bug fixes
❌ Leaving PR review comments without replies
❌ Requesting review before CI passes
❌ Using `any` types in TypeScript
❌ Modifying existing database migrations (create new ones)
❌ Committing secrets or API keys

## Testing Commands

```bash
# Root level
bun install          # Install all dependencies
bun lint             # Lint all packages (Biome)
bun typecheck        # Type check all packages

# App-specific
bun --filter watcher test    # Run watcher unit tests
bun --filter web test        # Run web unit tests
bun --filter web build       # Build web app

# E2E tests
cd apps/web && npx playwright test
cd apps/web && npx playwright test home.spec.ts  # Run specific spec
```

## Additional Resources

- Full AI guidelines: `docs/AI_AGENTS.md`
- GitHub Copilot context: `.github/copilot-instructions.md`
- Architecture: `ARCHITECTURE.md`
- Contributing: `CONTRIBUTING.md`