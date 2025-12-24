# Gov-Perf

Portuguese Parliament performance tracker - monitoring deputy activity, attendance, and legislative contributions.

## Project Structure

```
gov-perf/
├── apps/
│   ├── watcher/     # Data pipeline - fetches & transforms parliament data
│   └── web/         # React frontend - displays deputy performance
├── packages/
│   └── shared/      # Shared types and utilities
└── package.json     # Workspace root
```

## Quick Start

```bash
# Install dependencies
bun install

# Run frontend in development
bun dev

# Run data sync (watcher)
bun sync

# Run tests
bun test
```

## Apps

### Watcher (`apps/watcher`)

Data pipeline that:
- Fetches data from Parliament's open data API
- Validates against JSON schemas
- Transforms to normalized entities
- Syncs to Supabase database
- Archives snapshots to Backblaze B2

Runs on GitHub Actions (daily cron).

### Web (`apps/web`)

React 19 + Vite frontend that:
- Displays deputy "report cards" with Work Score
- Allows postal code lookup for local deputies
- Shows rankings and comparisons
- Generates shareable images

Deploys to Vercel.

## Tech Stack

- **Runtime**: Bun
- **Frontend**: React 19, Vite, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Backblaze B2 (snapshots)
- **Hosting**: Vercel (frontend), GitHub Actions (pipeline)

## License

MIT
