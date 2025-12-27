import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { DATASETS, POLITENESS_UA, SNAPSHOT_PATH } from './config.js';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Retry on 5xx errors
      if (res.status >= 500) {
        lastError = new Error(`Server error: ${res.status}`);
        console.warn(`[WARN] Attempt ${attempt}/${retries} failed: ${res.status}`);
      } else {
        // Don't retry on 4xx errors
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[WARN] Attempt ${attempt}/${retries} failed: ${lastError.message}`);
    }

    if (attempt < retries) {
      const delay = INITIAL_DELAY_MS * 2 ** (attempt - 1);
      console.log(`[DEBUG] Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

async function fetchSingleDataset(
  dataset: { name: string; url: string },
  timestamp: string
): Promise<void> {
  console.log(`[DEBUG] Fetching dataset: ${dataset.name} from ${dataset.url}`);
  const res = await fetchWithRetry(dataset.url, {
    headers: { 'user-agent': POLITENESS_UA },
  });
  if (!res.ok) throw new Error(`${dataset.name} download failed ${res.status}`);

  const filePath = `${SNAPSHOT_PATH}/${timestamp}/${dataset.name}.json`;
  console.log(`[DEBUG] Writing dataset to: ${filePath}`);
  const file = createWriteStream(filePath);
  await pipeline(res.body as unknown as NodeJS.ReadableStream, file);
  console.log(`[DEBUG] Finished writing: ${filePath}`);
}

export async function fetchDatasets(timestamp: string) {
  try {
    console.log(`[DEBUG] Creating snapshot directory: ${SNAPSHOT_PATH}/${timestamp}`);
    await mkdir(`${SNAPSHOT_PATH}/${timestamp}`, { recursive: true });

    // Fetch all datasets in parallel for faster downloads
    console.log(`[DEBUG] Fetching ${DATASETS.length} datasets in parallel...`);
    const startTime = Date.now();

    await Promise.all(
      DATASETS.map((d) => fetchSingleDataset(d, timestamp))
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[DEBUG] All datasets fetched in ${elapsed}s for timestamp: ${timestamp}`);
  } catch (err) {
    console.error('[ERROR] fetchDatasets failed:', err);
    throw err;
  }
}
