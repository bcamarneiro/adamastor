# TODO

## In Progress

### Sync Pipeline Optimization

- [x] Parallel dataset fetching (already implemented in fetcher.ts)
- [x] Biography TTL filtering (7-day TTL in biography.ts)
- [x] Incremental attendance scraping (only new meetings in attendance.ts)
- [x] Parallel transform phases (Phase 3 runs 4 tasks concurrently)
- [ ] Content hash diffing to skip unchanged data (optional - low priority)

## Pending

### New Features

- [ ] Global search component (see issue #12 for testing)
- [ ] Advanced ranking filters (by party, district, grade) - see issue #10

## Completed

### Data Consistency Testing (2024-12-28)

- [x] Verify database invariant tests exist (invariants.test.ts - 15+ tests)
- [x] Verify stats calculation tests exist (helpers.test.ts)
- [x] Cross-view consistency tests verified
- [x] Investigate intervention counting - FINDING: Estimated at party level, distributed evenly
- [x] Investigate question_count - FINDING: Always 0, never populated (10% dead weight)

#### Known Data Accuracy Issues

1. **Intervention Count (20% of score)**: Counted at party level from debates, then distributed evenly to party members. Individual counts are estimates.
2. **Question Count (10% of score)**: Always initialized to 0 and never populated. This 10% of the formula contributes nothing.

### Photo Scraping (2024-12-28)

- [x] Create party-photos.ts scraper for PSD, CHEGA, BE
- [x] Add IL (Iniciativa Liberal) photo scraping - 9 deputies
- [x] Add PCP (Partido Comunista) photo scraping - 3 deputies
- [x] Add LIVRE photo scraping - 6 deputies
- [x] PS - No photos available (website only has text list)
- [x] CDS-PP - No deputies page found on website
- [x] PAN - Only 1 deputy, no photo URL in page HTML

### Branding & SEO (2024-12-28)

- [x] Generate logo (pixelated eye SVG)
- [x] Create favicon variants
- [x] Install react-helmet-async
- [x] Create SEO component with meta tags
- [x] Add SEO to all pages
- [x] Create robots.txt
- [x] Create sitemap.xml

### Features (2024-12-28 to 2026-01)

- [x] Party Comparison Page (`/partidos`, `/partidos/comparar`)
- [x] District Comparison Page (`/distritos`, `/distritos/comparar`)
- [x] Initiatives Page (`/initiatives`) with detail view
- [x] Parliament Page (`/parliament`) - full deputy listing
- [x] Battle Royale feature (`/batalha`) - side-by-side deputy comparison with profile links
- [x] Waste Calculator (`/desperdicio`)
- [x] Help tooltips for metrics (work score, grade, attendance, rankings)
- [x] Methodology, Contribute, and Mission pages (`/metodologia`, `/contribuir`, `/missao`)
- [x] Back button navigation using browser history (issue #24)
- [x] Party ranking calculation explanation (issue #47)

### CI/CD (Previous)

- [x] Fix sync workflow schema validation errors
- [x] Fix failing e2e tests
- [x] Add deputy profile page data validation tests
- [x] Set up staging/production environments
- [x] Configure GitHub Actions workflows
