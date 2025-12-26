# Services

Data fetching layer using React Query hooks.

## Pattern

Each service folder follows the same structure:

```
services/
├── featureName/
│   ├── index.ts          # Re-exports all hooks
│   ├── useQueryName.ts   # Individual hook file
│   └── types.ts          # Optional: feature-specific types
```

### Hook Template

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

async function fetchData(id: string) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error('Error message');
  return data;
}

export function useDataName(id: string | null) {
  return useQuery({
    queryKey: ['data-type', id],
    queryFn: () => fetchData(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

## Available Services

| Service | Description |
|---------|-------------|
| `reportCard` | Deputy details, district lookup, national averages |
| `leaderboard` | Top/bottom workers, full rankings |
| `battle` | Deputy comparison for Battle Royale |
| `waste` | Underperformance cost calculations |
| `initiatives` | Legislative proposals and details |
| `parliament` | General parliament data |

## Conventions

- **Naming**: `use<Resource><Action>` (e.g., `useDeputyDetail`, `useTopWorkers`)
- **Query Keys**: Descriptive array keys for cache invalidation
- **Stale Time**: 5 minutes default for relatively static data
- **Error Handling**: Throw errors for React Query to catch
- **Types**: Import from `lib/supabase` (auto-generated from schema)

## Adding a New Service

1. Create folder: `services/yourFeature/`
2. Create hook file: `useYourData.ts`
3. Create index: Re-export from `index.ts`
4. Import in component: `import { useYourData } from '@services/yourFeature'`
