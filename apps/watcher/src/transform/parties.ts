import { supabase } from '../supabase.js';
import { pipelineResult } from '../utils/pipeline-result.js';
import { getPartyColor } from './parties-colors.js';

export { PARTY_COLORS, getPartyColor } from './parties-colors.js';

interface ParliamentGrupoParlamentar {
  sigla: string;
  nome: string;
}

export async function transformParties(
  grupos: ParliamentGrupoParlamentar[]
): Promise<Map<string, string>> {
  console.log(`📦 Transforming ${grupos.length} parties...`);

  const partyMap = new Map<string, string>(); // acronym -> uuid
  let failedCount = 0;
  const errors: string[] = [];

  for (const gp of grupos) {
    const party = {
      external_id: gp.sigla, // Use acronym as external_id (TEXT)
      acronym: gp.sigla,
      name: gp.nome,
      color: getPartyColor(gp.sigla),
    };

    // Upsert by external_id (which is unique in the schema)
    const { data, error } = await supabase
      .from('parties')
      .upsert(party, { onConflict: 'external_id' })
      .select('id, acronym')
      .single();

    if (error) {
      console.error(`  ❌ Error upserting party ${gp.sigla}:`, error.message);
      failedCount++;
      if (errors.length < 5) errors.push(`${gp.sigla}: ${error.message}`);

      // Fail fast on authentication errors
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        pipelineResult.addStep('Parties', {
          status: 'error',
          processed: grupos.length,
          failed: grupos.length,
          errors: ['Authentication failed: Invalid Supabase API key'],
        });
        throw new Error('Authentication failed: Invalid Supabase API key');
      }
      continue;
    }

    partyMap.set(data.acronym, data.id);
    console.log(`  ✓ ${gp.sigla} -> ${data.id}`);
  }

  // Record step result
  const status =
    failedCount === 0 ? 'success' : failedCount === grupos.length ? 'error' : 'warning';
  pipelineResult.addStep('Parties', {
    status,
    processed: grupos.length,
    failed: failedCount,
    errors,
  });

  console.log(`✅ Parties: ${partyMap.size} loaded\n`);
  return partyMap;
}
