# Gov-Perf Implementation Plan

**Created:** 2025-12-24
**Status:** Draft
**Goal:** Consolidate architecture, implement MVP features from Notion

---

## Phase 0: Project Cleanup (DONE)

- [x] Archive `gov-perf` GitHub repository
- [x] Add DEPRECATED.md to `gov-perf` local project
- [x] Add DEPRECATED.md to `gov-perf-be` local project
- [ ] Optionally delete deprecated local folders after backup

---

## Phase 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

```
Project: gov-perf
Region: eu-west (Portugal)
```

### 1.2 Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================
-- CORE ENTITIES
-- ===================

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,        -- AR's party ID
  acronym TEXT NOT NULL,                    -- PS, PSD, CH, etc.
  name TEXT NOT NULL,
  color TEXT,                               -- Hex color for UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,                -- Lisboa, Porto, etc.
  postal_prefixes TEXT[] NOT NULL,          -- ['1000', '1100', '1200', ...]
  deputy_count INTEGER,                      -- Seats in this district
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deputies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,         -- AR's deputy ID
  name TEXT NOT NULL,
  short_name TEXT,                          -- Display name
  party_id UUID REFERENCES parties(id),
  district_id UUID REFERENCES districts(id),
  photo_url TEXT,
  mandate_start DATE,
  mandate_end DATE,
  is_active BOOLEAN DEFAULT true,
  legislature INTEGER DEFAULT 16,           -- XVI = 16
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputies_party ON deputies(party_id);
CREATE INDEX idx_deputies_district ON deputies(district_id);
CREATE INDEX idx_deputies_active ON deputies(is_active);

-- ===================
-- ACTIVITY TRACKING
-- ===================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  type TEXT,                                -- plenary, committee, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  deputy_id UUID REFERENCES deputies(id),
  initiative_id UUID,                       -- References initiatives
  vote TEXT NOT NULL,                       -- 'favor', 'contra', 'abstencao', 'ausente'
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, deputy_id, initiative_id)
);

CREATE INDEX idx_votes_deputy ON votes(deputy_id);
CREATE INDEX idx_votes_vote ON votes(vote);

CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE,
  deputy_id UUID REFERENCES deputies(id),
  session_id UUID REFERENCES sessions(id),
  date DATE NOT NULL,
  type TEXT,                                -- 'plenary', 'committee', 'question'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interventions_deputy ON interventions(deputy_id);
CREATE INDEX idx_interventions_date ON interventions(date);

CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,         -- AR's initiative ID
  title TEXT NOT NULL,
  type TEXT,                                -- 'projeto_lei', 'proposta_lei', etc.
  type_desc TEXT,
  status TEXT,
  submitted_at DATE,
  legislature INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE initiative_authors (
  initiative_id UUID REFERENCES initiatives(id),
  deputy_id UUID REFERENCES deputies(id),
  PRIMARY KEY (initiative_id, deputy_id)
);

-- ===================
-- COMPUTED STATS
-- ===================

CREATE TABLE deputy_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deputy_id UUID UNIQUE REFERENCES deputies(id),

  -- Raw counts
  total_sessions INTEGER DEFAULT 0,
  sessions_attended INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  votes_cast INTEGER DEFAULT 0,             -- Excludes 'ausente'
  proposal_count INTEGER DEFAULT 0,
  intervention_count INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,

  -- Calculated rates
  attendance_rate DECIMAL(5,2),             -- 0.00 to 100.00

  -- Work Score (0-100)
  work_score DECIMAL(5,2),
  grade CHAR(1),                            -- A, B, C, D, F

  -- Comparisons
  district_rank INTEGER,
  national_rank INTEGER,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_grade CHECK (grade IN ('A', 'B', 'C', 'D', 'F'))
);

CREATE INDEX idx_deputy_stats_score ON deputy_stats(work_score DESC);
CREATE INDEX idx_deputy_stats_grade ON deputy_stats(grade);

-- ===================
-- AUDIT TRAIL
-- ===================

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,                -- 'deputy', 'vote', 'initiative', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,                     -- 'create', 'update', 'delete'
  old_data JSONB,
  new_data JSONB,
  diff JSONB,
  source_file TEXT,                         -- Which dataset triggered this
  source_hash TEXT,                         -- SHA256 of source file
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_events(created_at);

-- ===================
-- FUNCTIONS
-- ===================

-- Function to calculate Work Score
CREATE OR REPLACE FUNCTION calculate_work_score(
  p_attendance_rate DECIMAL,
  p_proposals DECIMAL,
  p_avg_proposals DECIMAL,
  p_interventions DECIMAL,
  p_avg_interventions DECIMAL,
  p_questions DECIMAL,
  p_avg_questions DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    p_attendance_rate * 0.40 +
    LEAST((p_proposals / NULLIF(p_avg_proposals, 0)) * 100, 200) * 0.30 +
    LEAST((p_interventions / NULLIF(p_avg_interventions, 0)) * 100, 200) * 0.20 +
    LEAST((p_questions / NULLIF(p_avg_questions, 0)) * 100, 200) * 0.10
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get grade from score
CREATE OR REPLACE FUNCTION score_to_grade(score DECIMAL) RETURNS CHAR(1) AS $$
BEGIN
  RETURN CASE
    WHEN score >= 85 THEN 'A'
    WHEN score >= 70 THEN 'B'
    WHEN score >= 55 THEN 'C'
    WHEN score >= 40 THEN 'D'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 Seed Data: Districts with Postal Codes

```sql
INSERT INTO districts (name, postal_prefixes, deputy_count) VALUES
('Aveiro', ARRAY['3800', '3810', '3830', '4505'], 16),
('Beja', ARRAY['7800', '7830'], 3),
('Braga', ARRAY['4700', '4710', '4715', '4720'], 19),
('Bragança', ARRAY['5300', '5340'], 3),
('Castelo Branco', ARRAY['6000', '6060'], 4),
('Coimbra', ARRAY['3000', '3020', '3030', '3040'], 9),
('Évora', ARRAY['7000', '7050'], 3),
('Faro', ARRAY['8000', '8100', '8200', '8500'], 9),
('Guarda', ARRAY['6300', '6320'], 4),
('Leiria', ARRAY['2400', '2410', '2430', '3100'], 10),
('Lisboa', ARRAY['1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2600', '2610', '2685', '2695', '2700', '2710', '2720', '2730', '2740', '2750', '2760', '2765', '2770', '2775', '2780', '2785', '2790', '2795', '2800', '2810', '2820', '2825', '2830', '2840', '2845', '2855', '2860', '2865', '2870'], 48),
('Portalegre', ARRAY['7300', '7320'], 2),
('Porto', ARRAY['4000', '4050', '4100', '4150', '4200', '4250', '4300', '4400', '4450', '4470', '4480', '4490', '4500', '4510', '4520', '4535', '4560', '4570', '4580', '4585', '4590', '4600', '4610', '4620', '4630', '4640', '4650', '4660', '4690'], 40),
('Santarém', ARRAY['2000', '2005', '2025', '2040', '2050', '2065', '2070', '2080', '2100', '2130', '2140', '2150'], 9),
('Setúbal', ARRAY['2900', '2910', '2925', '2950', '2955', '2965', '2970', '7500', '7540', '7555', '7565', '7570', '7580'], 18),
('Viana do Castelo', ARRAY['4900', '4910', '4920', '4930', '4940', '4950', '4960', '4970', '4980', '4990'], 6),
('Vila Real', ARRAY['5000', '5030', '5040', '5050', '5060', '5070', '5085', '5100', '5110', '5120', '5130', '5140', '5150', '5155', '5370', '5400', '5425', '5445', '5450', '5460', '5470'], 5),
('Viseu', ARRAY['3500', '3510', '3520', '3530', '3560', '3570', '3600', '3610', '3620', '3640', '3650', '3660', '3670', '3680', '3700', '4540', '4550', '5100', '5120', '6270'], 9),
('Açores', ARRAY['9500', '9545', '9555', '9560', '9580', '9600', '9625', '9630', '9640', '9650', '9675', '9680', '9700', '9760', '9800', '9850', '9875', '9880', '9900', '9930', '9940', '9950', '9960', '9970', '9980'], 5),
('Madeira', ARRAY['9000', '9020', '9024', '9030', '9050', '9060', '9100', '9125', '9135', '9200', '9225', '9230', '9240', '9270', '9300', '9325', '9350', '9360', '9370', '9385', '9400'], 6),
('Europa', ARRAY[], 2);  -- Emigration circle
```

---

## Phase 2: Transform Module (gov-perf-watcher)

### 2.1 New Dependencies

```bash
bun add @supabase/supabase-js
```

### 2.2 New File Structure

```
gov-perf-watcher/
├── src/
│   ├── fetcher.ts          # existing
│   ├── validator.ts        # existing
│   ├── diff.ts             # existing
│   ├── hash.ts             # existing
│   ├── upload-b2.ts        # existing (cold storage)
│   ├── normalise.ts        # existing
│   ├── config.ts           # existing
│   │
│   ├── transform/          # NEW
│   │   ├── index.ts        # Main transformer orchestrator
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── parties.ts      # Extract parties from informacao_base
│   │   ├── deputies.ts     # Extract deputies from informacao_base
│   │   ├── sessions.ts     # Extract sessions from atividades
│   │   ├── votes.ts        # Extract votes from atividades
│   │   ├── interventions.ts # Extract interventions
│   │   ├── initiatives.ts  # Extract from iniciativas
│   │   └── stats.ts        # Calculate work_score, attendance
│   │
│   └── db/                 # NEW
│       ├── supabase.ts     # Supabase client singleton
│       ├── upsert.ts       # Generic upsert with conflict handling
│       └── audit.ts        # Log changes to audit_events
│
├── index.ts                # Modified - add transform step
├── package.json
└── .env                    # Add SUPABASE_URL, SUPABASE_KEY
```

### 2.3 Implementation Order

1. **db/supabase.ts** - Client initialization
2. **transform/types.ts** - TypeScript interfaces matching DB schema
3. **transform/parties.ts** - Parse parties from informacao_base
4. **transform/deputies.ts** - Parse deputies, link to parties/districts
5. **db/upsert.ts** - Upsert with change detection
6. **db/audit.ts** - Log changes
7. **transform/sessions.ts** - Parse sessions
8. **transform/votes.ts** - Parse votes (complex - needs deputy lookup)
9. **transform/interventions.ts** - Parse interventions
10. **transform/initiatives.ts** - Parse initiatives + authors
11. **transform/stats.ts** - Calculate work_score for all deputies
12. **transform/index.ts** - Orchestrate all transformers

### 2.4 Updated Main Pipeline

```typescript
// index.ts (simplified view)
import { transform } from "./src/transform/index.js";
import { supabase } from "./src/db/supabase.js";

(async () => {
  // 1. Fetch datasets (existing)
  await fetchDatasets(ts);

  // 2. Validate (existing)
  for (const d of DATASETS) {
    await validate(...);
  }

  // 3. Upload raw snapshots (existing - cold storage)
  for (const d of DATASETS) {
    await uploadFile(...);
  }

  // 4. Transform & sync to Supabase (NEW)
  const snapshotPath = `${SNAPSHOT_PATH}/${ts}`;
  await transform(snapshotPath);

  // 5. Make "latest" (existing)
  for (const d of DATASETS) {
    await makeLatest(...);
  }
})();
```

---

## Phase 3: Frontend MVP Features

### 3.1 API Integration

Replace Vercel Blob JSON fetching with Supabase queries:

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 3.2 New Pages/Features

| Feature | Route | Priority |
|---------|-------|----------|
| Deputy Report Card | `/deputado/:id` | P0 |
| Postal Code Lookup | `/` (homepage) | P0 |
| Rankings (Top/Bottom) | `/rankings` | P0 |
| Battle Royale | `/comparar` | P1 |
| Waste Calculator | `/calculadora` | P1 |
| Share Image Generator | (component) | P0 |

### 3.3 Key Components to Build

```
src/
├── components/
│   ├── ReportCard/
│   │   ├── ReportCard.tsx       # Main card with grade, metrics
│   │   ├── GradeCircle.tsx      # A-F grade visualization
│   │   ├── MetricBar.tsx        # Progress bar for each metric
│   │   └── ShareableCard.tsx    # 1080x1080 for social media
│   │
│   ├── PostalCodeLookup/
│   │   ├── PostalCodeInput.tsx  # Input with autocomplete
│   │   └── DistrictResult.tsx   # Shows deputies for district
│   │
│   ├── Rankings/
│   │   ├── RankingList.tsx      # Sortable list
│   │   ├── TopWorkers.tsx       # Top 3 highlight
│   │   └── BottomLazy.tsx       # Bottom 3 highlight
│   │
│   └── Share/
│       ├── ShareButton.tsx      # Share to social
│       └── ImageGenerator.tsx   # html-to-image wrapper
```

### 3.4 Dependencies to Add

```bash
npm install html-to-image qrcode.react
```

---

## Phase 4: GitHub Actions

### 4.1 Update Workflow

```yaml
# .github/workflows/sync.yml
name: Sync Parliament Data

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:      # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - run: bun install

      - name: Run sync
        env:
          B2_KEY_ID: ${{ secrets.B2_KEY_ID }}
          B2_APP_KEY: ${{ secrets.B2_APP_KEY }}
          B2_BUCKET: ${{ secrets.B2_BUCKET }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: bun run index.ts
```

### 4.2 Required Secrets

- `B2_KEY_ID` - Backblaze (existing)
- `B2_APP_KEY` - Backblaze (existing)
- `B2_BUCKET` - Backblaze (existing)
- `SUPABASE_URL` - NEW
- `SUPABASE_SERVICE_KEY` - NEW (use service role, not anon)

---

## Phase 5: Launch Checklist

### Pre-Launch
- [ ] Supabase project created
- [ ] Schema deployed
- [ ] Districts seeded with postal codes
- [ ] Transform module complete
- [ ] First successful sync run
- [ ] Frontend Report Card working
- [ ] Share image generation working
- [ ] Analytics added (Plausible/Vercel)

### Launch
- [ ] Deploy frontend to Vercel
- [ ] Test postal code lookup
- [ ] Test share functionality
- [ ] Post on social media
- [ ] Monitor for errors

### Post-Launch (Week 1)
- [ ] Track shares (success metric: 10+)
- [ ] Gather feedback
- [ ] Fix critical bugs
- [ ] Decide: continue or pivot

---

## Timeline Estimate

| Phase | Work | Days |
|-------|------|------|
| Phase 1 | Supabase setup + schema | 1 |
| Phase 2 | Transform module | 3-4 |
| Phase 3 | Frontend MVP features | 3-4 |
| Phase 4 | GitHub Actions update | 0.5 |
| Phase 5 | Testing + launch | 1-2 |
| **Total** | | **8-11 days** |

---

## Spec-Driven Development Approach

This project follows a **spec-first** development approach. Before implementing each component, we define:

1. **Data Specifications** - JSON schemas for input/output data
2. **Interface Contracts** - TypeScript interfaces for all modules
3. **Test Fixtures** - Sample data for unit testing
4. **Acceptance Criteria** - What "done" looks like

### Spec Files Structure

```text
gov-perf-watcher/
├── specs/
│   ├── data/
│   │   ├── informacao_base.schema.json   # Input schema
│   │   ├── atividades.schema.json        # Input schema
│   │   ├── iniciativas.schema.json       # Input schema
│   │   ├── agenda.schema.json            # Input schema
│   │   ├── deputy.schema.json            # Output entity
│   │   ├── vote.schema.json              # Output entity
│   │   └── work_score.schema.json        # Computed metric
│   │
│   ├── api/
│   │   ├── supabase.types.ts             # Generated from DB schema
│   │   └── frontend.types.ts             # API response types
│   │
│   └── fixtures/
│       ├── sample_informacao_base.json   # Test data
│       ├── sample_atividades.json        # Test data
│       ├── expected_deputies.json        # Expected output
│       └── expected_work_scores.json     # Expected calculations
│
├── src/
│   └── ...
```

### Workflow for Each Feature

1. **Write Spec** → Define schema/interface in `specs/`
2. **Create Fixture** → Add sample input/output data
3. **Write Test** → Test against fixture with expected output
4. **Implement** → Code until tests pass
5. **Validate** → Run against real data

### Priority Specs to Define

| Spec | Purpose | Status |
|------|---------|--------|
| `deputy.schema.json` | Deputy entity structure | TODO |
| `work_score.schema.json` | Work score calculation rules | TODO |
| `transform.interface.ts` | Transformer module contract | TODO |
| `api_responses.ts` | Frontend API contracts | TODO |

---

## Data Sources Analysis

### Current Datasets in Watcher (4 endpoints)

| Dataset | URL Pattern | Contains |
|---------|-------------|----------|
| `informacao_base` | `InformacaoBaseXVI_json.txt` | Deputies, parties, districts, legislature info |
| `agenda` | `AgendaParlamentar_json.txt` | Parliamentary schedule, session dates |
| `atividades` | `AtividadesXVI_json.txt` | Deputy activities, interventions, votes |
| `iniciativas` | `IniciativasXVI_json.txt` | Legislative initiatives, proposals |

### Parliament Open Data Categories (Available but not fetched)

From `https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx`:

| Category | Needed for MVP? | Notes |
|----------|-----------------|-------|
| Atividade dos Deputados | ❓ Maybe | May have more granular attendance data |
| Composição de Órgãos | ❌ No | Committee compositions |
| Intervenções | ❓ Maybe | Speech/intervention records |
| Registo Biográfico | ⚠️ Nice-to-have | Deputy bios, photos |
| Perguntas e Requerimentos | ⚠️ Nice-to-have | Questions to government |

### MVP Data Requirements

For Work Score calculation, we need:

- ✅ **Attendance rate** → Should be in `atividades`
- ✅ **Proposals** → In `iniciativas` (initiative authors)
- ✅ **Interventions** → In `atividades`
- ✅ **Questions** → May be in `atividades` or need separate endpoint

**The current 4 datasets should be sufficient for MVP.**

---

## Open Questions

1. **Postal code accuracy** - Need to verify district-to-postal mapping is complete
2. **Deputy photos** - Where do we get them? Can extract from registo biográfico later
3. **Historical data** - Do we backfill previous legislatures later?
4. **Attendance calculation** - Need to analyze `atividades` structure to confirm attendance tracking

---

## Notes

- Keep existing B2/Vercel Blob upload for cold storage/audit trail
- Frontend can use Supabase client directly (no need for separate API)
- Consider RLS (Row Level Security) if public API needed later
- Work Score formula can be adjusted - make weights configurable
