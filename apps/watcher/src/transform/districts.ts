import { supabase } from '../supabase.js';
import { pipelineResult } from '../utils/pipeline-result.js';
import { DISTRICT_POSTAL_PREFIXES } from './district-postal-prefixes.js';

// Re-export for backwards compatibility
export { DISTRICT_POSTAL_PREFIXES };

interface ParliamentCirculoEleitoral {
  cpId: number;
  cpDes: string;
  legDes: string;
}

// Deputy counts per district (fixed by electoral law)
const DISTRICT_DEPUTY_COUNTS: Record<string, number> = {
  Lisboa: 48,
  Porto: 40,
  Braga: 19,
  Setúbal: 18,
  Aveiro: 16,
  Leiria: 10,
  Faro: 9,
  Santarém: 9,
  Coimbra: 9,
  'Viana do Castelo': 6,
  'Vila Real': 5,
  Viseu: 8,
  'Castelo Branco': 4,
  Guarda: 4,
  Beja: 3,
  Évora: 3,
  Bragança: 3,
  Portalegre: 2,
  Açores: 5,
  Madeira: 6,
  Europa: 2,
  'Fora da Europa': 2,
};

// Slugs for each district (URL-friendly)
const DISTRICT_SLUGS: Record<string, string> = {
  Açores: 'acores',
  Aveiro: 'aveiro',
  Beja: 'beja',
  Braga: 'braga',
  Bragança: 'braganca',
  'Castelo Branco': 'castelo-branco',
  Coimbra: 'coimbra',
  Europa: 'europa',
  Évora: 'evora',
  Faro: 'faro',
  'Fora da Europa': 'fora-da-europa',
  Guarda: 'guarda',
  Leiria: 'leiria',
  Lisboa: 'lisboa',
  Madeira: 'madeira',
  Portalegre: 'portalegre',
  Porto: 'porto',
  Santarém: 'santarem',
  Setúbal: 'setubal',
  'Viana do Castelo': 'viana-do-castelo',
  'Vila Real': 'vila-real',
  Viseu: 'viseu',
};

export async function transformDistricts(
  circulos: ParliamentCirculoEleitoral[]
): Promise<Map<number, string>> {
  console.log(`📦 Transforming ${circulos.length} districts...`);

  const districtMap = new Map<number, string>(); // cpId -> uuid
  let failedCount = 0;
  const errors: string[] = [];

  for (const ce of circulos) {
    const district = {
      name: ce.cpDes,
      slug: DISTRICT_SLUGS[ce.cpDes] || ce.cpDes.toLowerCase().replace(/\s+/g, '-'),
      deputy_count: DISTRICT_DEPUTY_COUNTS[ce.cpDes] || 0,
      postal_prefixes: DISTRICT_POSTAL_PREFIXES[ce.cpDes] || [],
    };

    // Upsert by name (which is unique in the schema)
    const { data, error } = await supabase
      .from('districts')
      .upsert(district, { onConflict: 'name' })
      .select('id, name')
      .single();

    if (error) {
      console.error(`  ❌ Error upserting district ${ce.cpDes}:`, error.message);
      failedCount++;
      if (errors.length < 5) errors.push(`${ce.cpDes}: ${error.message}`);

      // Fail fast on authentication errors
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        pipelineResult.addStep('Districts', {
          status: 'error',
          processed: circulos.length,
          failed: circulos.length,
          errors: ['Authentication failed: Invalid Supabase API key'],
        });
        throw new Error('Authentication failed: Invalid Supabase API key');
      }
      continue;
    }

    districtMap.set(ce.cpId, data.id);
    console.log(`  ✓ ${ce.cpDes} -> ${data.id}`);
  }

  // Record step result
  const status =
    failedCount === 0 ? 'success' : failedCount === circulos.length ? 'error' : 'warning';
  pipelineResult.addStep('Districts', {
    status,
    processed: circulos.length,
    failed: failedCount,
    errors,
  });

  console.log(`✅ Districts: ${districtMap.size} loaded\n`);
  return districtMap;
}
