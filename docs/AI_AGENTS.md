# AI Agent Collaboration Guidelines

This document provides guidelines for AI agents (Cursor, GitHub Copilot, Claude Code, GitHub Copilot Reviews) and humans using AI assistance to work effectively with the Adamastor repository.

## General Principles

### Code Quality

- **Keep functions small and focused** - Single responsibility principle
- **Use descriptive names** - Function and variable names should clearly express intent
- **Add docstrings** - Document complex logic, especially in transform pipeline steps
- **Update tests when behavior changes** - Tests are safety nets for AI-driven changes
- **Never commit secrets** - No API keys, tokens, or sensitive data in code or commits

### Monorepo Awareness

- **Respect workspace structure** - Use `bun --filter` for app-specific commands
- **Be aware of cross-app dependencies** - Changes to `packages/shared/` affect both `watcher` and `web`
- **Test changes in affected apps** - When touching shared code, verify both apps still work
- **Use workspace commands** - `bun --filter watcher test`, `bun --filter web build`

### Change Scope

- **Small, focused changes** - One feature, one bug fix, one refactor per PR
- **Clear commit messages** - Describe what changed and why
- **Incremental improvements** - Build up complex features in small steps

---

## Tool-Specific Guidance

### Inline Assistants (GitHub Copilot, Cursor Inline)

**Best for:**
- Single function changes
- Component prop additions
- Type definitions
- Small utility functions

**Example prompts:**
- ✅ "Add a `formatDate` function that converts ISO dates to Portuguese format"
- ✅ "Add a `loading` prop to the `DeputyCard` component"
- ❌ "Refactor the entire transform pipeline" (too broad)

### IDE/Chat Agents (Cursor Agent Mode, Claude Code)

**Best for:**
- Multi-file changes
- Refactoring across modules
- Adding test coverage
- Documentation updates

**Example prompts:**
- ✅ "Add unit tests for `transformParties()` in `apps/watcher/src/transform/parties.ts`"
- ✅ "Refactor `DeputyCard` component to extract `GradeCircle` into a separate file, add tests"
- ✅ "Update ARCHITECTURE.md to document the new attendance scraping incremental logic"
- ❌ "Make the UI better" (too vague, no scope)

### PR Reviewers (GitHub Copilot Reviews)

**Best for:**
- Code review feedback
- Identifying potential bugs
- Suggesting improvements

**To help AI reviewers:**
- Write clear PR descriptions (see [PR Template](../.github/PULL_REQUEST_TEMPLATE.md))
- Include "What", "Why", "How", and "Testing" sections
- Link related issues
- Highlight risks and breaking changes

### Responding to PR Review Comments

When reviewing PRs or addressing Copilot comments, **always leave a reply** on each comment:

1. **Reply format for addressed comments**:

   ```text
   Fixed in commit <sha>. <brief description of the fix>
   ```

2. **Reply format for intentionally skipped comments**:

   ```text
   Intentionally not addressed: <reasoning why the current approach is correct>
   ```

3. **Never silently skip comments** - Every Copilot comment must have a response so the user knows the status

---

## Critical Paths (Handle with Extra Care)

These areas require extra attention when making changes:

### 1. Transform Pipeline (`apps/watcher/src/transform/`)

**Why critical:** This is the core data processing logic. Errors here affect data accuracy.

**Guidelines:**
- Test each transform step independently
- Understand step dependencies (see [ARCHITECTURE.md](../ARCHITECTURE.md#the-transform-pipeline))
- Maintain ID mappings correctly (DepId, DepCadId, biography_id)
- Add tests when modifying transform logic

**Example safe change:**
```typescript
// Adding a new field to party transform
export async function transformParties(parties: PartyData[]) {
  return parties.map(p => ({
    id: p.id,
    acronym: p.acronym,
    name: p.name,
    color: p.color,
    // ✅ Safe: Adding a new optional field
    website: p.website || null,
  }));
}
```

**Example risky change (requires approval):**
```typescript
// ❌ Risky: Changing ID mapping logic
// This affects downstream steps - requires careful testing
```

### 2. Work Score Calculation

**Why critical:** This determines deputy grades and rankings. Formula changes affect all deputies.

**Locations:**
- Database function: `supabase/migrations/*_functions.sql` → `calculate_work_score()`
- TypeScript helper: `apps/watcher/src/data-consistency/helpers.ts` → `calculateWorkScore()`
- Shared types: `packages/shared/src/types.ts` (for UI display)

**Guidelines:**
- Keep database function and TypeScript helper in sync
- Update both when changing the formula
- Add tests for edge cases (null values, zero averages, outliers)
- Document formula changes in PR description

**Current formula:**
```
Work Score = 
  40% attendance_rate +
  30% (proposals / avg_proposals) * 100 (capped at 200%) +
  20% (interventions / avg_interventions) * 100 (capped at 200%) +
  10% (questions / avg_questions) * 100 (capped at 200%)
```

### 3. Database Schema (`supabase/migrations/`)

**Why critical:** Schema changes affect production data and require migrations.

**Guidelines:**
- Always create migrations for schema changes
- Test migrations locally: `npx supabase db reset`
- Never modify existing migrations (create new ones)
- Document breaking changes in migration comments

### 4. Shared Types (`packages/shared/`)

**Why critical:** Changes affect both `watcher` and `web` apps.

**Guidelines:**
- Test changes in both apps
- Avoid breaking changes (use optional fields, versioning)
- Update TypeScript references if needed

---

## Common Tasks

### Adding a New Transform Step

1. Create `apps/watcher/src/transform/your-step.ts`
2. Export main function: `export async function transformYourData(...)`
3. Add to pipeline in `apps/watcher/src/transform/index.ts`
4. Add tests: `apps/watcher/src/transform/your-step.test.ts`
5. Create migration if new tables needed

**Example:**
```typescript
// apps/watcher/src/transform/your-step.ts
export async function transformYourData(data: YourData[]): Promise<Map<string, string>> {
  // Transform logic
  const result = new Map();
  for (const item of data) {
    // Process item
  }
  return result;
}
```

### Adding Tests

**Watcher (Bun test):**
```typescript
// apps/watcher/src/transform/parties.test.ts
import { describe, it, expect } from 'bun:test';
import { transformParties } from './parties';

describe('transformParties', () => {
  it('should transform party data correctly', () => {
    const input = [{ id: 1, acronym: 'PS', name: 'Partido Socialista' }];
    const result = transformParties(input);
    expect(result.get(1)).toBe('PS');
  });
});
```

**Web (Vitest + Testing Library):**
```typescript
// apps/web/src/components/ReportCard/GradeCircle.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradeCircle } from './GradeCircle';

describe('GradeCircle', () => {
  it('should display grade A correctly', () => {
    render(<GradeCircle grade="A" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
```

### Writing Good PR Descriptions

**Structure:**
1. **Summary** - One sentence describing what changed
2. **Context / Motivation** - Why this change is needed
3. **Implementation Details** - How it works, key design decisions
4. **Affected Apps/Packages** - watcher, web, shared, supabase, or multiple
5. **Risks / Trade-offs** - Breaking changes, performance, data consistency
6. **Testing** - What was tested, test coverage added

**Example:**
```markdown
## Summary
Adds incremental attendance scraping to reduce pipeline runtime.

## Context
Attendance scraping was taking 15+ minutes. This change only scrapes new meetings since last run.

## Implementation Details
- Added `last_scraped_at` tracking in `plenary_meetings` table
- Modified `fetchAllAttendance()` to skip meetings already in database
- Added migration to backfill `last_scraped_at` for existing meetings

## Affected Apps/Packages
- `apps/watcher` (attendance scraper, transform step)
- `supabase/migrations` (new migration)

## Risks / Trade-offs
- Low risk: Only affects scraping logic, not data transformation
- Migration is safe (adds nullable column, backfills data)

## Testing
- ✅ Unit tests added for incremental logic
- ✅ Manual test: Ran pipeline twice, second run skipped existing meetings
- ✅ Verified data consistency (attendance counts unchanged)
```

---

## Examples: Good vs Bad Prompts

### ✅ Good Prompts

**Specific and actionable:**
- "Add unit tests for `transformParties()` function in `apps/watcher/src/transform/parties.ts`. Test edge cases: empty array, duplicate IDs, missing required fields."
- "Refactor `DeputyCard` component: extract `GradeCircle` into `apps/web/src/components/ReportCard/GradeCircle.tsx`, add tests, update imports."
- "Update `ARCHITECTURE.md` to document the incremental attendance scraping logic added in PR #123."

**Clear scope:**
- "Fix TypeScript error in `apps/web/src/services/reportCard/useDeputy.ts` line 45: `deputy` may be null."
- "Add error handling to `apps/watcher/src/fetcher.ts` for network timeouts (retry 3 times with exponential backoff)."

### ❌ Bad Prompts

**Too vague:**
- "Fix the transform" (which transform? what's wrong?)
- "Make the UI better" (what needs improvement? which page?)
- "Add tests" (for what? where?)

**Too broad:**
- "Refactor everything" (breaks down into many smaller tasks)
- "Optimize the pipeline" (which part? what's the goal?)

**Missing context:**
- "Fix the bug" (what bug? where?)
- "Update the function" (which function? what change?)

---

## Testing Patterns

### Arrange-Act-Assert

```typescript
describe('transformParties', () => {
  it('should handle empty input', () => {
    // Arrange
    const input: PartyData[] = [];
    
    // Act
    const result = transformParties(input);
    
    // Assert
    expect(result.size).toBe(0);
  });
});
```

### Test One Thing Per Test

```typescript
// ✅ Good: One test, one assertion
it('should map party ID to acronym', () => {
  const result = transformParties([{ id: 1, acronym: 'PS' }]);
  expect(result.get(1)).toBe('PS');
});

// ❌ Bad: Multiple unrelated assertions
it('should transform parties correctly', () => {
  // Tests ID mapping
  // Tests acronym handling
  // Tests color parsing
  // Too many things!
});
```

### Use Fixtures for Common Setup

```typescript
// apps/watcher/src/transform/__fixtures__/parties.ts
export const mockParties = [
  { id: 1, acronym: 'PS', name: 'Partido Socialista', color: '#FF0000' },
  { id: 2, acronym: 'PSD', name: 'Partido Social Democrata', color: '#0000FF' },
];

// In test file
import { mockParties } from './__fixtures__/parties';
```

---

## Monorepo-Specific Patterns

### Running Commands

```bash
# App-specific
bun --filter watcher test
bun --filter web build

# Root-level (all apps)
bun lint
bun typecheck
```

### Cross-App Dependencies

When changing `packages/shared/`:
1. Make the change
2. Test in watcher: `bun --filter watcher test`
3. Test in web: `bun --filter web test`
4. Build both: `bun --filter '*' build`

### TypeScript Project References

The monorepo uses TypeScript project references. When adding new files:
- Ensure `tsconfig.json` includes the new files
- Run `bun typecheck` to verify references are correct

---

## Security & Secrets

**Never commit:**
- API keys
- Database credentials
- Service account tokens
- Private keys
- `.env` files (they're in `.gitignore`, but double-check)

**Use environment variables:**
```typescript
// ✅ Good
const apiKey = process.env.PARLIAMENT_API_KEY;

// ❌ Bad
const apiKey = 'sk_live_abc123...';
```

---

## Getting Help

- **Questions about architecture**: See [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Setup issues**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Testing guidance**: See [docs/TESTING.md](TESTING.md)
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests

---

## Summary Checklist

Before submitting a PR with AI assistance:

- [ ] Changes are small and focused
- [ ] Tests added/updated (if behavior changed)
- [ ] Documentation updated (if needed)
- [ ] No secrets committed
- [ ] Both apps tested (if touching shared code)
- [ ] PR description is clear and complete
- [ ] CI passes (`bun lint`, `bun typecheck`, `bun test`)

---

**Remember:** AI agents are powerful collaborators, but they need clear guidance. Be specific, test thoroughly, and document your changes well.

