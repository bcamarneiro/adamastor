/**
 * Transform module for plenary attendance data.
 *
 * Handles:
 * 1. Upsert plenary meetings
 * 2. Match deputies by name (since BID is different from DepId)
 * 3. Upsert attendance records
 * 4. Update deputy biography_id for future lookups
 */

import { CURRENT_LEGISLATURE } from '../config.js';
import type { AttendanceRecord, PlenaryMeeting } from '../scrapers/attendance.js';
import { supabase } from '../supabase.js';
import { namesMatch } from './attendance-helpers.js';

interface DeputyMatch {
  id: string;
  name: string;
  short_name: string | null;
  biography_id: number | null;
}

/**
 * Upsert plenary meetings and return a map of BID -> UUID
 */
async function upsertMeetings(meetings: PlenaryMeeting[]): Promise<Map<number, string>> {
  console.log(`  Upserting ${meetings.length} plenary meetings...`);

  const meetingMap = new Map<number, string>();
  const batchSize = 50;

  for (let i = 0; i < meetings.length; i += batchSize) {
    const batch = meetings.slice(i, i + batchSize).map((m) => ({
      external_id: m.bid,
      meeting_date: m.date,
      legislature: CURRENT_LEGISLATURE,
    }));

    const { data, error } = await supabase
      .from('plenary_meetings')
      .upsert(batch, { onConflict: 'external_id' })
      .select('id, external_id');

    if (error) {
      console.error('  ❌ Error upserting meetings batch:', error.message);
      continue;
    }

    for (const meeting of data || []) {
      meetingMap.set(meeting.external_id, meeting.id);
    }
  }

  console.log(`  ✅ Upserted ${meetingMap.size} meetings`);
  return meetingMap;
}

/**
 * Load all deputies for matching
 */
async function loadDeputies(): Promise<DeputyMatch[]> {
  const { data, error } = await supabase
    .from('deputies')
    .select('id, name, short_name, biography_id')
    .eq('is_active', true);

  if (error) {
    console.error('  ❌ Error loading deputies:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Match attendance records to deputies and update biography_id
 */
async function matchDeputies(
  attendance: AttendanceRecord[],
  deputies: DeputyMatch[]
): Promise<{
  matched: Map<number, string>; // deputyBid -> deputyUuid
  unmatched: string[];
}> {
  const matched = new Map<number, string>();
  const unmatched: string[] = [];

  // First, try to match by biography_id (for deputies we've already matched)
  const byBiographyId = new Map<number, DeputyMatch>();
  for (const dep of deputies) {
    if (dep.biography_id) {
      byBiographyId.set(dep.biography_id, dep);
    }
  }

  // Get unique deputies from attendance
  const uniqueDeputies = new Map<number, { name: string; party: string }>();
  for (const record of attendance) {
    if (!uniqueDeputies.has(record.deputyBid)) {
      uniqueDeputies.set(record.deputyBid, {
        name: record.deputyName,
        party: record.party,
      });
    }
  }

  console.log(`  Matching ${uniqueDeputies.size} unique deputies from attendance...`);

  const biographyIdUpdates: Array<{ id: string; biography_id: number }> = [];

  for (const [deputyBid, info] of uniqueDeputies) {
    // Try direct biography_id match first
    const directMatch = byBiographyId.get(deputyBid);
    if (directMatch) {
      matched.set(deputyBid, directMatch.id);
      continue;
    }

    // Try name matching
    const nameMatch = deputies.find(
      (dep) =>
        namesMatch(dep.name, info.name) || (dep.short_name && namesMatch(dep.short_name, info.name))
    );

    if (nameMatch) {
      matched.set(deputyBid, nameMatch.id);

      // Queue biography_id update if not already set
      if (!nameMatch.biography_id) {
        biographyIdUpdates.push({
          id: nameMatch.id,
          biography_id: deputyBid,
        });
      }
    } else {
      unmatched.push(`${info.name} (${info.party}) [BID=${deputyBid}]`);
    }
  }

  // Update biography_id for newly matched deputies
  if (biographyIdUpdates.length > 0) {
    console.log(`  Updating biography_id for ${biographyIdUpdates.length} deputies...`);

    for (const update of biographyIdUpdates) {
      const { error } = await supabase
        .from('deputies')
        .update({ biography_id: update.biography_id })
        .eq('id', update.id);

      if (error) {
        console.error('  ❌ Error updating biography_id:', error.message);
      }
    }
  }

  console.log(`  ✅ Matched ${matched.size}/${uniqueDeputies.size} deputies`);

  if (unmatched.length > 0) {
    console.log(`  ⚠️  Unmatched deputies (${unmatched.length}):`);
    for (const name of unmatched.slice(0, 10)) {
      console.log(`     - ${name}`);
    }
    if (unmatched.length > 10) {
      console.log(`     ... and ${unmatched.length - 10} more`);
    }
  }

  return { matched, unmatched };
}

/**
 * Upsert attendance records
 */
async function upsertAttendance(
  attendance: AttendanceRecord[],
  meetingMap: Map<number, string>,
  deputyMap: Map<number, string>
): Promise<number> {
  console.log(`  Upserting ${attendance.length} attendance records...`);

  // Use a Map to deduplicate by deputy_id+meeting_id key
  const recordsMap = new Map<
    string,
    {
      deputy_id: string;
      meeting_id: string;
      status: string;
      status_raw: string;
      reason: string | null;
    }
  >();

  for (const record of attendance) {
    const deputyId = deputyMap.get(record.deputyBid);
    const meetingId = meetingMap.get(record.meetingBid);

    if (!deputyId || !meetingId) {
      continue;
    }

    // Create unique key for deduplication
    const key = `${deputyId}:${meetingId}`;

    // Only add if not already present (keep first occurrence)
    if (!recordsMap.has(key)) {
      recordsMap.set(key, {
        deputy_id: deputyId,
        meeting_id: meetingId,
        status: record.status,
        status_raw: record.statusRaw,
        reason: record.reason,
      });
    }
  }

  const records = Array.from(recordsMap.values());
  console.log(`  Deduplicated to ${records.length} unique records`);

  if (records.length === 0) {
    console.log('  ⚠️  No valid attendance records to insert');
    return 0;
  }

  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('plenary_attendance')
      .upsert(batch, { onConflict: 'deputy_id,meeting_id' })
      .select('id');

    if (error) {
      console.error('  ❌ Error upserting attendance batch:', error.message);
      continue;
    }

    insertedCount += data?.length || 0;
  }

  console.log(`  ✅ Upserted ${insertedCount} attendance records`);
  return insertedCount;
}

/**
 * Main transform function for attendance data
 */
export async function transformAttendance(
  meetings: PlenaryMeeting[],
  attendance: AttendanceRecord[]
): Promise<{
  meetingsCount: number;
  attendanceCount: number;
  matchedDeputies: number;
  unmatchedDeputies: string[];
}> {
  console.log('📋 Transforming plenary attendance...\n');

  // Step 1: Upsert meetings
  const meetingMap = await upsertMeetings(meetings);

  // Step 2: Load deputies for matching
  const deputies = await loadDeputies();
  console.log(`  Loaded ${deputies.length} active deputies\n`);

  // Step 3: Match deputies by name
  const { matched: deputyMap, unmatched: unmatchedDeputies } = await matchDeputies(
    attendance,
    deputies
  );

  // Step 4: Upsert attendance records
  const attendanceCount = await upsertAttendance(attendance, meetingMap, deputyMap);

  console.log('\n  Summary:');
  console.log(`    Meetings: ${meetingMap.size}`);
  console.log(`    Attendance records: ${attendanceCount}`);
  console.log(`    Matched deputies: ${deputyMap.size}`);
  console.log(`    Unmatched deputies: ${unmatchedDeputies.length}`);

  return {
    meetingsCount: meetingMap.size,
    attendanceCount,
    matchedDeputies: deputyMap.size,
    unmatchedDeputies,
  };
}
