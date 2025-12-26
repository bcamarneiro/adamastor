/**
 * Deputy stats initialization.
 * Ensures every deputy has a corresponding deputy_stats record.
 */

import { supabase } from '../../supabase.js';

export async function ensureDeputyStats(deputyMap: Map<number, string>): Promise<void> {
  console.log('📊 Ensuring deputy_stats records exist...');

  const deputyIds = Array.from(deputyMap.values());
  const batchSize = 50;

  // Check which deputy_stats already exist (in batches)
  const existingIds = new Set<string>();

  for (let i = 0; i < deputyIds.length; i += batchSize) {
    const batch = deputyIds.slice(i, i + batchSize);
    const { data: existing, error: selectError } = await supabase
      .from('deputy_stats')
      .select('deputy_id')
      .in('deputy_id', batch);

    if (selectError) {
      console.error('  ❌ Error checking existing stats:', selectError.message);
      continue;
    }

    for (const s of existing || []) {
      existingIds.add(s.deputy_id);
    }
  }

  const missingIds = deputyIds.filter((id) => !existingIds.has(id));

  if (missingIds.length === 0) {
    console.log(`  All ${deputyIds.length} deputy_stats records exist`);
    return;
  }

  console.log(`  Creating ${missingIds.length} new deputy_stats records...`);

  // Insert missing stats in batches
  for (let i = 0; i < missingIds.length; i += batchSize) {
    const batch = missingIds.slice(i, i + batchSize);
    const newStats = batch.map((deputy_id) => ({
      deputy_id,
      proposal_count: 0,
      intervention_count: 0,
      question_count: 0,
      party_votes_favor: 0,
      party_votes_against: 0,
      party_votes_abstain: 0,
      party_total_votes: 0,
      work_score: 0,
      grade: 'F',
      national_rank: 0,
      district_rank: 0,
    }));

    const { error: insertError } = await supabase.from('deputy_stats').insert(newStats);

    if (insertError) {
      console.error('  ❌ Error inserting stats batch:', insertError.message);
    }
  }

  console.log(`✅ Created ${missingIds.length} new deputy_stats records\n`);
}
