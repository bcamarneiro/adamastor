# Environment Setup Guide

## Supabase Configuration

This project uses **new Supabase Publishable API keys** (not legacy keys).

## Environment Files

### Local Development (`.env.local`)
Uses local Supabase instance running at `http://127.0.0.1:54321`:
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Staging (`.env.staging`)
Uses adamastor-staging project:
```bash
VITE_SUPABASE_URL=https://gwzxoqzktnluqiilxiew.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_AJxjHs7QJ8zd1JYAPOB0ow_JI7zmxHl
```

### Production (`.env.production`)
Uses adamastor-prod project:
```bash
VITE_SUPABASE_URL=https://qiqtgjhlolwukdlagaag.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Yml1-VGcigY4T1MqUnbqJg_01GL8B1T
```

## Deployment

### Vercel Production
Production environment variables are already configured in Vercel:
- `VITE_SUPABASE_URL` → Production Supabase URL
- `VITE_SUPABASE_ANON_KEY` → Production publishable key

### Building for Different Environments

```bash
# Local development (uses .env.local)
bun run dev

# Build for staging (uses .env.staging)
bun run build --mode staging

# Build for production (uses .env.production)
bun run build --mode production
```

## Security Notes

✅ **Safe to commit:**
- `.env.staging` (publishable keys are safe for frontend)
- `.env.production` (publishable keys are safe for frontend)
- `.env.example`

❌ **Never commit:**
- `.env.local` (may contain local secrets)
- Any file with `service_role` keys (secret keys)

## Rotating Keys

If keys are compromised:
1. Go to Supabase Dashboard → Project Settings → API
2. Generate new Publishable API key
3. Update environment files and Vercel variables
4. Revoke old keys

## Migration from Legacy Keys

✅ **Completed:** This project now uses new Publishable API keys (format: `sb_publishable_*`)
🗑️ **Deprecated:** Old anon/service_role keys (format: `eyJ*`) are legacy and should not be used
