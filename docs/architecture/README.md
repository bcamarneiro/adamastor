# Architecture Documentation

This directory contains Architecture Decision Records (ADRs) documenting key architectural patterns and decisions in the Adamastor codebase.

## What are ADRs?

Architecture Decision Records (ADRs) are lightweight documents that capture important architectural decisions made throughout a project's lifecycle. Each ADR describes:
- **Context**: What problem we're solving
- **Decision**: What we decided to do
- **Consequences**: Trade-offs and outcomes

## Active ADRs

| ADR | Title | Status | Last Updated |
|-----|-------|--------|--------------|
| [ADR-001](./ADR-001-monorepo.md) | Monorepo Structure with Bun Workspaces | Accepted | 2026-01-14 |
| [ADR-002](./ADR-002-nextjs-patterns.md) | React + Vite Architecture Patterns | Accepted | 2026-01-14 |
| [ADR-003](./ADR-003-supabase.md) | Supabase Integration Patterns | Accepted | 2026-01-14 |
| [ADR-004](./ADR-004-testing.md) | Testing Strategy | Accepted | 2026-01-14 |

## Quick Reference

### Tech Stack Summary
- **Runtime**: Bun (workspaces, test runner)
- **Frontend**: React 19 + Vite + React Router v6
- **Styling**: Tailwind CSS v4 + Radix UI
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack React Query
- **Testing**: Vitest (unit) + Playwright (E2E)
- **CI/CD**: GitHub Actions + Vercel

### Repository Structure
```
adamastor/
├── apps/
│   ├── web/              # React frontend (Vite)
│   └── watcher/          # Data sync service (Bun)
├── packages/
│   └── shared/           # Shared types & utilities
├── docs/
│   ├── architecture/     # ADRs (this directory)
│   ├── AI_AGENTS.md      # AI collaboration guidelines
│   └── TESTING.md        # Testing guide
└── .github/workflows/    # CI/CD pipelines
```

### Key Architectural Principles

1. **Monorepo with Workspaces**: Bun workspaces for fast, simple dependency management
2. **Client-Side Rendering**: Vite SPA for performance, no SSR overhead
3. **Service Layer Pattern**: Abstract data sources (Supabase, APIs) behind TypeScript services
4. **Component-First UI**: Radix UI primitives + Tailwind utilities for accessible, maintainable components
5. **Testing Pyramid**: Heavy E2E coverage for UI, unit tests for business logic
6. **One-Way Data Sync**: `apps/watcher` syncs Parliament API → Supabase daily

## When to Write a New ADR

Create a new ADR when making a decision that:
- ✅ Changes core architecture (e.g., migrating from React Query to SWR)
- ✅ Affects multiple teams or components (e.g., new authentication strategy)
- ✅ Has long-term consequences (e.g., database migration)
- ✅ Requires understanding "why" not just "what" (e.g., choosing Bun over npm)

**Don't create ADRs for**:
- ❌ Minor implementation details (e.g., button color choice)
- ❌ Temporary experiments (e.g., trying a new library)
- ❌ Obvious decisions (e.g., using TypeScript in a TypeScript project)

## ADR Template

When creating a new ADR, use this template:

```markdown
# ADR-XXX: [Decision Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
[Describe the problem and why a decision is needed]

## Decision
[What we decided to do and why]

## Consequences
[Positive and negative outcomes]

## Examples
[Code examples from the codebase]

## References
[Links to relevant docs, PRs, issues]
```

Save as `docs/architecture/ADR-XXX-short-title.md` (use next available number).

## Related Documentation

- **[docs/AI_AGENTS.md](../AI_AGENTS.md)**: AI agent collaboration guidelines
- **[docs/TESTING.md](../TESTING.md)**: How to run tests locally
- **[.claude/CLAUDE.md](../../.claude/CLAUDE.md)**: Claude Code project guidelines
- **[README.md](../../README.md)**: Project overview and setup

## Contributing

When updating architecture:
1. Read relevant ADRs first to understand current decisions
2. Propose changes via GitHub issue if significant
3. Update or create ADR documenting the change
4. Reference ADR number in PR description

---

**Last Updated**: 2026-01-14
**Maintained By**: Adamastor Core Team
