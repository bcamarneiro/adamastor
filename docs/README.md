# Documentation Index

Welcome to the Adamastor technical documentation. This directory contains guides for contributors, architecture decisions, and operational procedures.

## 📚 Quick Links

### For Contributors
- **[AI Agents Guidelines](AI_AGENTS.md)** - Best practices for AI-assisted development with Claude Code, Cursor, GitHub Copilot
- **[Testing Guide](TESTING.md)** - How to write and run tests (unit, E2E, data contract)
- **[TODO List](TODO.md)** - Project roadmap and outstanding tasks

### For Maintainers
- **[GitHub Secrets Management](GITHUB-SECRETS.md)** - Managing sensitive environment variables and deployment keys

### Architecture
- **[Architecture Decision Records](architecture/README.md)** - Index of all ADRs
  - [ADR-001: Monorepo Structure](architecture/ADR-001-monorepo.md)
  - [ADR-002: Next.js Patterns](architecture/ADR-002-nextjs-patterns.md)
  - [ADR-003: Supabase Integration](architecture/ADR-003-supabase.md)
  - [ADR-004: Testing Strategy](architecture/ADR-004-testing.md)

### Archive
- **[Workflow Summary](archive/workflow_summary.md)** - GitHub issue backlog pilot (Jan 2025)

## 📖 Root-Level Documentation

For general project information, see:
- **[README.md](../README.md)** - Project overview and quick start
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Setup guide and development workflow
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - System architecture and data flow
- **[RELEASING.md](../RELEASING.md)** - Release process and versioning

## 🏗️ Component-Specific Docs

### Web App (apps/web)
- [E2E Test Organization](../apps/web/e2e/README.md)
- [Data Contract Tests](../apps/web/e2e/data-contracts/README.md)
- [Services Architecture](../apps/web/src/services/README.md)

### Data Pipeline (apps/watcher)
- [Watcher Overview](../apps/watcher/README.md)
- [Deputy Photo Audit](../apps/watcher/DEPUTY_PHOTO_AUDIT.md)

## 🤝 Contributing to Documentation

When adding new documentation:
1. **Keep it focused** - One doc = one topic
2. **Link liberally** - Cross-reference related docs
3. **Update this index** - Make it discoverable
4. **Use ADRs for decisions** - Document the "why" in architecture/

### Document Lifecycle
- **Active docs** → `docs/`
- **Deprecated docs** → `docs/archive/` with date
- **Component-specific** → Keep in component directory
- **General guides** → Root level (README, CONTRIBUTING)

## 📝 Documentation Standards

- Use Markdown with GitHub Flavored Markdown (GFM)
- Include table of contents for docs > 200 lines
- Link to code examples with line numbers: `[file.ts:42](../apps/web/src/file.ts#L42)`
- Date ADRs: `YYYY-MM-DD` format
- Keep examples up-to-date with codebase

---

**Last Updated:** 2025-01-23
**Maintained by:** Adamastor Contributors
