import { supabase } from '../supabase.js';
import { type ParliamentAtividades, countInterventionsByParty } from './activities-helpers.js';

export type { ParliamentAtividades } from './activities-helpers.js';

export async function countInterventions(
  atividades: ParliamentAtividades,
  _partyMap: Map<string, string>
): Promise<Map<string, number>> {
  console.log('📦 Counting interventions from debates...');

  const debates = atividades.Debates || [];
  console.log(`  Found ${debates.length} debates`);

  const interventionCounts = countInterventionsByParty(atividades);

  console.log('✅ Intervention counts by party:');
  for (const [party, count] of interventionCounts) {
    console.log(`  ${party}: ${count}`);
  }
  console.log('');

  return interventionCounts;
}

// Note: The Parliament API doesn't provide individual deputy intervention counts directly.
// We can only count at the party level from debates.
// For individual deputy stats, we'll distribute party interventions proportionally
// or mark as "estimated from party data".

export async function distributeInterventionsToDeputies(
  interventionsByParty: Map<string, number>,
  partyMap: Map<string, string>
): Promise<Map<string, number>> {
  console.log('📦 Distributing interventions to deputies...');

  const deputyInterventions = new Map<string, number>(); // deputy_id -> count

  for (const [partyAcronym, totalInterventions] of interventionsByParty) {
    const partyId = partyMap.get(partyAcronym);
    if (!partyId) {
      console.log(`  ⚠️ Party ${partyAcronym} not found in map`);
      continue;
    }

    // Get active deputies for this party
    const { data: deputies, error } = await supabase
      .from('deputies')
      .select('id')
      .eq('party_id', partyId)
      .eq('is_active', true);

    if (error) {
      console.error(`  ❌ Error fetching deputies for ${partyAcronym}:`, error.message);
      continue;
    }

    if (!deputies || deputies.length === 0) {
      console.log(`  ⚠️ No active deputies for ${partyAcronym}`);
      continue;
    }

    // Distribute evenly (floor division)
    const perDeputy = Math.floor(totalInterventions / deputies.length);
    const remainder = totalInterventions % deputies.length;

    for (let i = 0; i < deputies.length; i++) {
      const deputy = deputies[i];
      if (!deputy) continue;
      // First `remainder` deputies get +1 to account for remainder
      const count = perDeputy + (i < remainder ? 1 : 0);
      deputyInterventions.set(deputy.id, count);
    }

    console.log(
      `  ${partyAcronym}: ${totalInterventions} interventions -> ${deputies.length} deputies (~${perDeputy} each)`
    );
  }

  console.log(`✅ Distributed interventions to ${deputyInterventions.size} deputies\n`);
  return deputyInterventions;
}
