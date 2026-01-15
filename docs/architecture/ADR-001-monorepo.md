# ADR-001: Monorepo Structure with Bun Workspaces

## Status
Accepted

## Context
Adamastor is a monorepo containing a web application (`apps/web`), a data sync service (`apps/watcher`), and shared utilities (`packages/shared`). We need a workspace manager that supports our TypeScript + React + Bun tech stack efficiently.

## Decision
Use **Bun workspaces** instead of Turborepo or npm workspaces for the following reasons:

1. **Performance**: Bun's native workspace resolution is faster than npm/pnpm
2. **Simplicity**: No additional tooling layer (Turborepo) required
3. **TypeScript-first**: Bun natively supports TypeScript without transpilation
4. **Compatibility**: Works seamlessly with our existing Vite + React setup

### Workspace Structure
```
adamastor/
├── apps/
│   ├── web/          # Next.js/React frontend (Vite build)
│   └── watcher/      # Data sync service (Bun runtime)
└── packages/
    └── shared/       # Shared types & utilities
```

### Configuration
**Root `package.json`:**
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "bun --filter web build",
    "sync": "bun --filter watcher start",
    "test": "cd apps/web && vitest run src && cd ../watcher && bun test"
  }
}
```

**Dependency References:**
```json
// apps/web/package.json
{
  "dependencies": {
    "shared": "workspace:*"  // Links to packages/shared
  }
}
```

## Consequences

### Positive
- ✅ Fast dependency installation (Bun's lockfile is faster than npm)
- ✅ Simple workspace references via `workspace:*` protocol
- ✅ No need for separate build orchestration tool
- ✅ Native TypeScript support reduces build complexity
- ✅ Consistent package manager across development and CI

### Negative
- ❌ Bun-specific syntax may limit future flexibility
- ❌ Requires Bun runtime (additional dependency for new contributors)
- ❌ Smaller ecosystem compared to npm/pnpm workspaces

### Trade-offs
- **Chosen**: Bun workspaces for speed and simplicity
- **Rejected**: Turborepo (added complexity), npm workspaces (slower)
- **Rationale**: For a 2-app monorepo, native Bun workspaces provide sufficient orchestration without additional tooling overhead

## Examples

### Running App-Specific Commands
```bash
# Run web app dev server
bun run --cwd apps/web vite

# Run watcher sync
bun --filter watcher start

# Run all tests
bun test  # Executes workspace-wide test script
```

### Adding Dependencies
```bash
# Add to specific workspace
cd apps/web && bun add react-query

# Add to root (dev dependencies)
bun add -D @biomejs/biome
```

### Shared Package Usage
```typescript
// apps/web/src/components/KeyMetrics.tsx
import { TOTAL_DEPUTIES, CURRENT_LEGISLATURE_ROMAN } from 'shared';

// Resolves to packages/shared/src/index.ts
```

## References
- [Bun Workspaces Documentation](https://bun.sh/docs/install/workspaces)
- Root `package.json` configuration
- `apps/web/package.json` and `apps/watcher/package.json` for workspace dependencies
