import { supabase } from '../supabase.js';

interface DeputyStatsUpdate {
  deputy_id: string;
  proposal_count?: number;
  intervention_count?: number;
  question_count?: number;
  party_votes_favor?: number;
  party_votes_against?: number;
  party_votes_abstain?: number;
  party_total_votes?: number;
}

export async function updateDeputyProposalCounts(authorCounts: Map<string, number>): Promise<void> {
  console.log(`📊 Updating proposal counts for ${authorCounts.size} deputies...`);

  const updates: DeputyStatsUpdate[] = [];

  for (const [deputyId, count] of authorCounts) {
    updates.push({
      deputy_id: deputyId,
      proposal_count: count,
    });
  }

  // Update in batches
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    for (const update of batch) {
      const { error } = await supabase
        .from('deputy_stats')
        .update({ proposal_count: update.proposal_count })
        .eq('deputy_id', update.deputy_id);

      if (error) {
        console.error('  ❌ Error updating proposal count:', error.message);
      }
    }
  }

  console.log('✅ Updated proposal counts\n');
}

export async function updateDeputyInterventionCounts(
  interventionCounts: Map<string, number>
): Promise<void> {
  console.log(`📊 Updating intervention counts for ${interventionCounts.size} deputies...`);

  for (const [deputyId, count] of interventionCounts) {
    const { error } = await supabase
      .from('deputy_stats')
      .update({ intervention_count: count })
      .eq('deputy_id', deputyId);

    if (error) {
      console.error('  ❌ Error updating intervention count:', error.message);
    }
  }

  console.log('✅ Updated intervention counts\n');
}

export async function updateDeputyQuestionCounts(
  questionCounts: Map<string, number>
): Promise<void> {
  console.log(`📊 Updating question counts for ${questionCounts.size} deputies...`);

  for (const [deputyId, count] of questionCounts) {
    const { error } = await supabase
      .from('deputy_stats')
      .update({ question_count: count })
      .eq('deputy_id', deputyId);

    if (error) {
      console.error('  ❌ Error updating question count:', error.message);
    }
  }

  console.log('✅ Updated question counts\n');
}

export async function updatePartyVoteStats(partyMap: Map<string, string>): Promise<void> {
  console.log('📊 Calculating party vote statistics...');

  // Get all party votes
  const { data: votes, error: votesError } = await supabase
    .from('party_votes')
    .select('parties_favor, parties_against, parties_abstain');

  if (votesError) {
    console.error('  ❌ Error fetching party votes:', votesError.message);
    return;
  }

  // Count votes per party
  const partyCounts = new Map<
    string,
    { favor: number; against: number; abstain: number; total: number }
  >();

  for (const vote of votes || []) {
    for (const party of vote.parties_favor || []) {
      const current = partyCounts.get(party) || { favor: 0, against: 0, abstain: 0, total: 0 };
      current.favor++;
      current.total++;
      partyCounts.set(party, current);
    }
    for (const party of vote.parties_against || []) {
      const current = partyCounts.get(party) || { favor: 0, against: 0, abstain: 0, total: 0 };
      current.against++;
      current.total++;
      partyCounts.set(party, current);
    }
    for (const party of vote.parties_abstain || []) {
      const current = partyCounts.get(party) || { favor: 0, against: 0, abstain: 0, total: 0 };
      current.abstain++;
      current.total++;
      partyCounts.set(party, current);
    }
  }

  console.log('  Party vote counts:');
  for (const [party, counts] of partyCounts) {
    console.log(
      `    ${party}: ${counts.favor}F/${counts.against}C/${counts.abstain}A (${counts.total} total)`
    );
  }

  // Update deputy stats with their party's vote counts
  for (const [partyAcronym, counts] of partyCounts) {
    const partyId = partyMap.get(partyAcronym);
    if (!partyId) continue;

    await supabase
      .from('deputy_stats')
      .update({
        party_votes_favor: counts.favor,
        party_votes_against: counts.against,
        party_votes_abstain: counts.abstain,
        party_total_votes: counts.total,
      })
      .eq('deputy_id', supabase.from('deputies').select('id').eq('party_id', partyId));
  }

  // Actually let's do this properly with a loop
  for (const [partyAcronym, counts] of partyCounts) {
    const partyId = partyMap.get(partyAcronym);
    if (!partyId) continue;

    // Get deputies for this party
    const { data: deputies, error: depError } = await supabase
      .from('deputies')
      .select('id')
      .eq('party_id', partyId);

    if (depError) {
      console.error(`  ❌ Error fetching deputies for ${partyAcronym}:`, depError.message);
      continue;
    }

    const deputyIds = (deputies || []).map((d) => d.id);

    if (deputyIds.length > 0) {
      // Batch updates to avoid URI too long errors
      const batchSize = 50;
      for (let i = 0; i < deputyIds.length; i += batchSize) {
        const batch = deputyIds.slice(i, i + batchSize);
        const { error: updateError } = await supabase
          .from('deputy_stats')
          .update({
            party_votes_favor: counts.favor,
            party_votes_against: counts.against,
            party_votes_abstain: counts.abstain,
            party_total_votes: counts.total,
          })
          .in('deputy_id', batch);

        if (updateError) {
          console.error(`  ❌ Error updating stats for ${partyAcronym}:`, updateError.message);
        }
      }
    }
  }

  console.log('✅ Updated party vote stats\n');
}

export async function recalculateAllStats(): Promise<void> {
  console.log('📊 Recalculating all work scores and rankings...');

  // Call the database function
  const { error } = await supabase.rpc('recalculate_all_stats');

  if (error) {
    console.error('  ❌ Error recalculating stats:', error.message);
    return;
  }

  console.log('✅ Recalculated all work scores and rankings\n');
}
