// ADA-211: Direct-URL e2e coverage for dynamic detail routes.
//
// These three routes were previously only reached transitively (by clicking
// from leaderboard/district/parties pages), so a routing regression
// (lazy-load failure, 404 on direct entry, missing data) on a bookmarked
// or shared URL would ship undetected.
//
// Each test fetches a known-good ID/slug from the Supabase REST API at
// runtime (avoiding hardcoded values that rot), navigates directly to the
// detail URL, and asserts core fields render.

import { expect, test } from './fixtures';

// Local Supabase fallbacks match `.github/workflows/ci.yml` e2e job and
// `apps/web/.env.example`. The anon key is a public test credential.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function supabaseRest<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase REST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

test.describe('Direct-URL detail routes (ADA-211)', () => {
  // -------- /deputado/:deputyId --------
  test.describe('Deputy detail page', () => {
    let deputyId: string;
    let deputyName: string;

    test.beforeAll(async () => {
      // Pick the first deputy from the deputy_details view (same source as the page).
      const rows = await supabaseRest<Array<{ id: string; name: string }>>(
        'deputy_details?select=id,name&limit=1'
      );
      expect(rows.length, 'Expected at least one deputy in deputy_details').toBeGreaterThan(0);
      deputyId = rows[0].id;
      deputyName = rows[0].name;
    });

    test('loads via direct URL and renders core deputy fields', async ({ page }) => {
      await page.goto(`/deputado/${deputyId}`);
      await page.waitForLoadState('networkidle');

      // URL preserved (not redirected to 404).
      await expect(page).toHaveURL(new RegExp(`/deputado/${deputyId}$`));

      // Deputy name rendered as an H1. DeputyPage may render multiple H1s
      // (page heading + ReportCardDetail's heading), so .first() avoids
      // strict-mode violation.
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await expect(page.getByText(deputyName, { exact: false }).first()).toBeVisible();

      // The "not found" fallback must NOT be visible.
      await expect(page.getByText(/Deputado nao encontrado/i)).toHaveCount(0);
    });
  });

  // -------- /distrito/:districtSlug --------
  test.describe('District detail page', () => {
    let districtSlug: string;
    let districtName: string;

    test.beforeAll(async () => {
      const rows = await supabaseRest<Array<{ slug: string; name: string }>>(
        'districts?select=slug,name&order=name.asc&limit=1'
      );
      expect(rows.length, 'Expected at least one district').toBeGreaterThan(0);
      districtSlug = rows[0].slug;
      districtName = rows[0].name;
    });

    test('loads via direct URL and renders core district fields', async ({ page }) => {
      await page.goto(`/distrito/${districtSlug}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(new RegExp(`/distrito/${districtSlug}$`));

      // District name should appear somewhere on the page (rendered via
      // DistrictDeputyList header / SEO title).
      await expect(page.getByText(districtName, { exact: false }).first()).toBeVisible();

      // The "not found" fallback must NOT be visible.
      await expect(page.getByText(/Distrito nao encontrado/i)).toHaveCount(0);
    });
  });

  // -------- /partidos/:partySlug --------
  test.describe('Party detail page', () => {
    let partySlug: string;
    let partyAcronym: string;

    test.beforeAll(async () => {
      // The page resolves the slug as a case-insensitive acronym match
      // against `party_stats`. We pick the highest-scoring party so the
      // page has something meaningful to render.
      const rows = await supabaseRest<Array<{ acronym: string }>>(
        'party_stats?select=acronym&order=avg_work_score.desc.nullslast&limit=1'
      );
      expect(rows.length, 'Expected at least one party in party_stats').toBeGreaterThan(0);
      partyAcronym = rows[0].acronym;
      partySlug = partyAcronym.toLowerCase();
    });

    test('loads via direct URL and renders core party fields', async ({ page }) => {
      await page.goto(`/partidos/${partySlug}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(new RegExp(`/partidos/${partySlug}$`));

      // Acronym renders as an H1.
      const h1 = page.getByRole('heading', { level: 1 }).first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(partyAcronym);

      // Core stat labels are present (structural, not value-dependent).
      await expect(page.getByText('Deputados', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Pontuação Média', { exact: true }).first()).toBeVisible();

      // The "not found" fallback must NOT be visible.
      await expect(page.getByText(/Partido n[ãa]o encontrado/i)).toHaveCount(0);
    });
  });
});
