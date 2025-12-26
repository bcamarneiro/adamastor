# Gov-Perf

> Track Portuguese Parliament performance with transparency.

[![CI](https://github.com/bcamarneiro/gov-perf/actions/workflows/ci.yml/badge.svg)](https://github.com/bcamarneiro/gov-perf/actions/workflows/ci.yml)

## What is this?

Gov-Perf collects public data from the Portuguese Parliament and calculates **performance metrics** for each deputy:

- **Proposals** - Bills and legislative initiatives authored
- **Interventions** - Speeches and participation in debates
- **Attendance** - Presence at plenary meetings
- **Questions** - Parliamentary questions submitted

Each deputy gets a **Work Score** and **letter grade** (A-F) based on their activity compared to the average.

> **Note:** This project measures *activity*, not *ideology*. We don't rate deputies on their political positions.

---

## Quick Start

```bash
# Prerequisites: Bun, Docker

git clone https://github.com/bcamarneiro/gov-perf.git
cd gov-perf
bun install

# Start local database
npx supabase start

# Run the web app
bun dev
```

Open <http://localhost:3000>

To populate with data, see [CONTRIBUTING.md](CONTRIBUTING.md#running-the-full-pipeline-locally).

---

## Documentation

| Document | What it covers |
|----------|----------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | How the system works - data flow, transforms, database |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Setup guide, development workflow, how to contribute |

---

## Project Structure

```
gov-perf/
├── apps/
│   ├── watcher/     # Data pipeline - fetches & transforms Parliament data
│   └── web/         # React frontend - displays deputy performance
├── packages/
│   └── shared/      # Shared TypeScript types
├── supabase/        # Database migrations and seed data
└── specs/           # Feature specifications
```

### How the pieces fit together

```
Parliament API  ──→  Watcher  ──→  Supabase  ──→  Web App  ──→  Browser
(public data)      (daily job)    (database)    (React)       (you)
```

**Watcher** runs daily via GitHub Actions, fetching Parliament data and transforming it.
**Web** is a React app that reads from Supabase and displays deputy performance.

---

## Features

| Feature | Description |
|---------|-------------|
| **Report Card** | Enter your postal code → see your deputies' grades |
| **Rankings** | National and district leaderboards |
| **Battle** | Compare two deputies head-to-head |
| **Waste Calculator** | See the cost of underperformance |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh) |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Pipeline | GitHub Actions |
| Hosting | Vercel |

---

## Data Sources

All data comes from official Parliament sources:

- [Open Data API](https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx) (deputies, initiatives, activities)
- Parliament website (attendance, biographies - scraped)

Data updates daily at 06:00 UTC.

---

## Political Neutrality

This project is **non-partisan**. We measure activity metrics only:

✓ How many proposals a deputy authored
✓ How many times they spoke in Parliament
✓ Whether they attended plenary sessions

✗ We do not rate political positions
✗ We do not endorse any party

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines.

---

## License

MIT
