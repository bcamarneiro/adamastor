/**
 * Sync State Management
 *
 * Tracks dataset hashes to enable incremental syncs.
 * Compares current file hash with stored hash to detect changes.
 */

import { stat } from 'node:fs/promises';
import { sha256 } from './hash.js';
import { supabase } from './supabase.js';

export interface SyncStateRecord {
  dataset: string;
  hash: string;
  file_size: number | null;
  last_synced_at: string;
  last_changed_at: string;
}

/**
 * Get the stored hash for a dataset from the database
 */
export async function getStoredHash(dataset: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('hash')
    .eq('dataset', dataset)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (not an error, just means first sync)
    console.error(`[WARN] Failed to get stored hash for ${dataset}:`, error.message);
  }

  return data?.hash ?? null;
}

/**
 * Get all stored sync states
 */
export async function getAllSyncStates(): Promise<SyncStateRecord[]> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .order('dataset');

  if (error) {
    console.error('[WARN] Failed to get sync states:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Update the stored hash for a dataset
 *
 * @param dataset - Dataset name
 * @param hash - New SHA256 hash
 * @param fileSize - File size in bytes (optional)
 * @param hasChanged - Whether the content has changed from previous sync
 */
export async function updateStoredHash(
  dataset: string,
  hash: string,
  fileSize?: number,
  hasChanged = true
): Promise<void> {
  const now = new Date().toISOString();

  const record: Partial<SyncStateRecord> = {
    dataset,
    hash,
    file_size: fileSize ?? null,
    last_synced_at: now,
  };

  // Only update last_changed_at if content actually changed
  if (hasChanged) {
    record.last_changed_at = now;
  }

  const { error } = await supabase.from('sync_state').upsert(record, {
    onConflict: 'dataset',
  });

  if (error) {
    console.error(`[ERROR] Failed to update sync state for ${dataset}:`, error.message);
    throw error;
  }
}

/**
 * Check if a dataset has changed since the last sync
 *
 * @param filePath - Path to the dataset file
 * @param dataset - Dataset name
 * @returns Object with hasChanged boolean and the current hash
 */
export async function checkDatasetChanged(
  filePath: string,
  dataset: string
): Promise<{ hasChanged: boolean; currentHash: string; fileSize: number }> {
  // Get file stats and hash in parallel
  const [fileStats, currentHash, storedHash] = await Promise.all([
    stat(filePath),
    sha256(filePath),
    getStoredHash(dataset),
  ]);

  const fileSize = fileStats.size;

  if (!storedHash) {
    console.log(`  📦 ${dataset}: First sync (no previous hash)`);
    return { hasChanged: true, currentHash, fileSize };
  }

  if (currentHash === storedHash) {
    console.log(`  ✅ ${dataset}: Unchanged (hash match)`);
    return { hasChanged: false, currentHash, fileSize };
  }

  console.log(`  🔄 ${dataset}: Changed (hash differs)`);
  return { hasChanged: true, currentHash, fileSize };
}

/**
 * Check multiple datasets for changes
 *
 * @param snapshotPath - Path to snapshot directory
 * @param datasetNames - Array of dataset names to check
 * @returns Map of dataset name to change status
 */
export async function checkAllDatasetsChanged(
  snapshotPath: string,
  datasetNames: string[]
): Promise<Map<string, { hasChanged: boolean; hash: string; fileSize: number }>> {
  console.log('🔍 Checking datasets for changes...\n');

  const results = new Map<string, { hasChanged: boolean; hash: string; fileSize: number }>();

  // Check all datasets in parallel
  const checks = await Promise.all(
    datasetNames.map(async (name) => {
      const filePath = `${snapshotPath}/${name}.json`;
      const result = await checkDatasetChanged(filePath, name);
      return { name, result };
    })
  );

  for (const { name, result } of checks) {
    results.set(name, {
      hasChanged: result.hasChanged,
      hash: result.currentHash,
      fileSize: result.fileSize,
    });
  }

  // Summary
  const changed = [...results.values()].filter((r) => r.hasChanged).length;
  console.log(`\n  Summary: ${changed}/${datasetNames.length} datasets changed\n`);

  return results;
}

/**
 * Update sync states for all checked datasets
 *
 * @param results - Map from checkAllDatasetsChanged
 */
export async function updateAllSyncStates(
  results: Map<string, { hasChanged: boolean; hash: string; fileSize: number }>
): Promise<void> {
  const updates = [...results.entries()].map(([dataset, { hasChanged, hash, fileSize }]) =>
    updateStoredHash(dataset, hash, fileSize, hasChanged)
  );

  await Promise.all(updates);
}
