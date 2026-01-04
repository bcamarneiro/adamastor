import { supabase } from '../supabase.js';
import { pipelineResult } from '../utils/pipeline-result.js';
import {
  DISTRICT_DEPUTY_COUNTS,
  DISTRICT_POSTAL_PREFIXES,
  DISTRICT_SLUGS,
} from './district-data.js';

interface ParliamentCirculoEleitoral {
  cpId: number;
  cpDes: string;
  legDes: string;
}

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
