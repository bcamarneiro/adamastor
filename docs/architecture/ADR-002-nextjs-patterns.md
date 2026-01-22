# ADR-002: React + Vite Architecture Patterns

## Status
Accepted

## Context
Adamastor is a client-side React application that displays Portuguese parliament data. We need consistent patterns for routing, component organization, data fetching, and state management that work well with static hosting (Vercel).

## Decision
Use **React + Vite + React Router** (not Next.js App Router) with the following architecture:

### 1. Routing Pattern
- **React Router v6** for client-side routing
- File-based mental model in `src/pages/` directory
- Routes defined in `src/routes.tsx`

**Example**:
```typescript
// src/routes.tsx
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/ranking', element: <LeaderboardPage /> },
  { path: '/deputados/:id', element: <DeputyDetailPage /> }
];
```

### 2. Component Architecture
```
src/
├── components/       # Reusable UI components
│   ├── Districts/   # Feature-specific components
│   ├── ui/          # Shared UI primitives (Radix UI wrappers)
│   └── Footer.tsx   # Layout components
├── pages/           # Route-level pages
│   ├── HomePage/
│   │   ├── HomePage.tsx
│   │   └── home-pt.md (content)
│   └── LeaderboardPage/
├── services/        # Data fetching & business logic
│   ├── parliament.ts
│   └── waste/
└── hooks/           # Reusable React hooks
```

### 3. Data Fetching Patterns
- **React Query** (`@tanstack/react-query`) for server state
- **Supabase Client** for database queries
- **Service layer** abstracts data sources

**Example**:
```typescript
// src/services/parliament.ts
export async function fetchDeputies() {
  const { data } = await supabase
    .from('deputies')
    .select('*')
    .eq('status', 'Efetivo');
  return data;
}

// src/pages/LeaderboardPage/useDeputies.ts
export function useDeputies() {
  return useQuery({
    queryKey: ['deputies'],
    queryFn: fetchDeputies,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}
```

### 4. State Management
- **React Query** for server state (deputies, initiatives, parties)
- **React Context** for global UI state (theme, sidebar)
- **Local useState** for component-specific state

**No Redux/Zustand** - React Query handles most state needs.

### 5. Styling Strategy
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Radix UI themes** for design system tokens
- **CSS variables** for theme customization
- **Utility-first** approach with semantic component classes

**Example**:
```typescript
// Component with Tailwind utilities
<div className="flex items-center gap-2 px-4 py-2 bg-neutral-2 rounded-lg">
  <span className="text-neutral-11">Deputy</span>
</div>

// Custom CSS variables (apps/web/src/styles/index.css)
:root {
  --map-score-a: #22c55e;  /* Green for A grade */
  --map-score-f: #ef4444;  /* Red for F grade */
}
```

## Consequences

### Positive
- ✅ **Fast builds**: Vite's HMR is faster than Next.js for SPA
- ✅ **Simple deployment**: Static site generation, no server required
- ✅ **Flexible routing**: Client-side routing for instant page transitions
- ✅ **React Query caching**: Reduces API calls, improves UX
- ✅ **Radix UI accessibility**: Pre-built accessible components

### Negative
- ❌ **No SSR**: All rendering happens client-side (SEO handled via `react-helmet-async`)
- ❌ **Initial bundle size**: Entire app loads upfront (mitigated with code splitting)
- ❌ **No API routes**: Backend logic runs in `apps/watcher` separately

### Trade-offs
- **Chosen**: React + Vite SPA for simplicity and speed
- **Rejected**: Next.js App Router (overkill for static parliament data)
- **Rationale**: Parliament data updates daily via `apps/watcher` cron job, no need for SSR/ISR

## Examples

### Page Component Pattern
```typescript
// src/pages/LeaderboardPage/LeaderboardPage.tsx
import { useDeputies } from './useDeputies';

const LeaderboardPage: React.FC = () => {
  const { data: deputies, isLoading } = useDeputies();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-neutral-2">
      <MainNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Ranking de Deputados</h1>
        <DeputyList deputies={deputies} />
      </main>
      <Footer />
    </div>
  );
};
```

### Service Layer Pattern
```typescript
// src/services/parliament.ts
import { supabase } from '@/lib/supabase';
import type { Deputy } from 'shared';

export const parliamentService = {
  async getDeputies(): Promise<Deputy[]> {
    const { data, error } = await supabase
      .from('deputies')
      .select('*')
      .order('work_score', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getDeputyById(id: string): Promise<Deputy | null> {
    const { data, error } = await supabase
      .from('deputies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
};
```

### React Query Integration
```typescript
// src/pages/LeaderboardPage/useDeputies.ts
import { useQuery } from '@tanstack/react-query';
import { parliamentService } from '@/services/parliament';

export function useDeputies() {
  return useQuery({
    queryKey: ['deputies', 'leaderboard'],
    queryFn: () => parliamentService.getDeputies(),
    staleTime: 1000 * 60 * 5,      // 5 minutes
    cacheTime: 1000 * 60 * 30,      // 30 minutes
    refetchOnWindowFocus: false,
  });
}
```

## References
- [Vite Documentation](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com/)
- `apps/web/src/routes.tsx` for routing configuration
- `apps/web/src/services/` for service layer patterns
