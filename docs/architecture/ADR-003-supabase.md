# ADR-003: Supabase Integration Patterns

## Status
Accepted

## Context
Adamastor stores Portuguese parliament data (deputies, initiatives, parties, attendance) in a PostgreSQL database. We need a database platform with:
- PostgreSQL hosting
- Real-time subscriptions (future feature)
- Row Level Security (RLS) for public read access
- TypeScript client SDK
- Edge-compatible queries for Vercel deployment

## Decision
Use **Supabase** as the database platform with the following integration patterns:

### 1. Database Schema Design
```sql
-- Core tables
deputies (id, name, party, constituency, photo_url, work_score, ...)
parties (id, name, acronym, color, seats, ...)
initiatives (id, number, title, phase, authors, ...)
attendance (deputy_id, session_date, present, ...)

-- Computed views
deputy_rankings (deputy_id, national_rank, party_rank, ...)
party_performance (party_id, avg_score, total_initiatives, ...)
```

**Key Principles**:
- Normalized schema for data integrity
- Materialized views for expensive queries
- `created_at` / `updated_at` timestamps on all tables
- Foreign keys with `ON DELETE CASCADE` for referential integrity

### 2. Supabase Client Configuration
```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false }, // No auth needed (public read-only)
    db: { schema: 'public' },
    global: { headers: { 'x-application': 'adamastor-web' } }
  }
);
```

### 3. Data Access Patterns
**Service Layer Abstraction**:
```typescript
// src/services/parliament.ts
export const parliamentService = {
  // Simple queries
  async getDeputies() {
    const { data, error } = await supabase
      .from('deputies')
      .select('*')
      .eq('status', 'Efetivo')
      .order('work_score', { ascending: false });

    if (error) throw new Error(`Failed to fetch deputies: ${error.message}`);
    return data;
  },

  // Joins with related data
  async getDeputyWithParty(id: string) {
    const { data, error } = await supabase
      .from('deputies')
      .select(`
        *,
        party:parties(id, name, acronym, color)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Filtered queries
  async getDeputiesByDistrict(district: string) {
    const { data, error } = await supabase
      .from('deputies')
      .select('*')
      .eq('constituency', district)
      .order('work_score', { ascending: false });

    if (error) throw error;
    return data;
  }
};
```

### 4. Row Level Security (RLS)
All tables have RLS enabled with public read access:
```sql
-- Enable RLS on all tables
ALTER TABLE deputies ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no authentication required)
CREATE POLICY "Allow public read access"
  ON deputies FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access"
  ON parties FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies → data managed by apps/watcher only
```

### 5. Data Synchronization
**One-way sync** from Parliament API → Supabase via `apps/watcher`:
```typescript
// apps/watcher/src/sync/deputies.ts
export async function syncDeputies() {
  // 1. Fetch from Parliament API
  const apiDeputies = await fetchFromParliamentAPI();

  // 2. Transform to our schema
  const transformedData = apiDeputies.map(transformDeputy);

  // 3. Upsert to Supabase
  const { error } = await supabase
    .from('deputies')
    .upsert(transformedData, { onConflict: 'id' });

  if (error) throw error;
}
```

**Sync Schedule**: Daily cron job at 00:00 UTC via Vercel Cron.

### 6. Error Handling
```typescript
// Consistent error handling across services
try {
  const { data, error } = await supabase.from('deputies').select('*');

  if (error) {
    console.error('Supabase query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
} catch (err) {
  console.error('Unexpected error:', err);
  throw err; // Re-throw for React Query error boundary
}
```

## Consequences

### Positive
- ✅ **Managed PostgreSQL**: No database ops overhead
- ✅ **Auto-generated TypeScript types**: Type-safe queries
- ✅ **Edge-compatible**: Works on Vercel Edge Runtime
- ✅ **Built-in RLS**: Security baked into database layer
- ✅ **Real-time ready**: Can add subscriptions later for live updates
- ✅ **Free tier**: 500MB database, 2GB bandwidth sufficient for MVP

### Negative
- ❌ **Vendor lock-in**: Supabase-specific client API
- ❌ **Query limitations**: Complex joins harder than raw SQL
- ❌ **RLS overhead**: Extra query planning time (minimal for read-only)

### Trade-offs
- **Chosen**: Supabase for managed PostgreSQL + TypeScript SDK
- **Rejected**: Prisma (adds ORM complexity), raw `pg` client (no RLS/Edge support)
- **Rationale**: Supabase's TypeScript-first SDK and RLS eliminate auth boilerplate

## Examples

### Complex Join Query
```typescript
// Fetch deputy with party, initiatives, and attendance stats
const { data } = await supabase
  .from('deputies')
  .select(`
    *,
    party:parties(name, acronym, color),
    initiatives:initiatives!deputy_id(count),
    attendance:attendance(
      session_date,
      present,
      sessions(type, date)
    )
  `)
  .eq('id', deputyId)
  .single();
```

### Aggregation Query
```typescript
// Get party performance stats
const { data } = await supabase
  .from('parties')
  .select(`
    *,
    deputies(count),
    initiatives(count)
  `)
  .order('seats', { ascending: false });
```

### Full-Text Search
```typescript
// Search deputies by name
const { data } = await supabase
  .from('deputies')
  .select('*')
  .textSearch('name', searchQuery, { type: 'websearch' })
  .limit(10);
```

## References
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- `apps/web/src/lib/supabase.ts` for client configuration
- `apps/web/src/services/parliament.ts` for query patterns
- `apps/watcher/src/sync/` for data synchronization logic
