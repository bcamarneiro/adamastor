import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { DATASETS, SNAPSHOT_PATH, POLITENESS_UA } from "./config.js";

export async function fetchDatasets(timestamp: string) {
	try {
		console.log(`[DEBUG] Creating snapshot directory: ${SNAPSHOT_PATH}/${timestamp}`);
		await mkdir(`${SNAPSHOT_PATH}/${timestamp}`, { recursive: true });

		for (const d of DATASETS) {
			console.log(`[DEBUG] Fetching dataset: ${d.name} from ${d.url}`);
			const res = await fetch(d.url, {
				headers: { "user-agent": POLITENESS_UA },
			});
			if (!res.ok) throw new Error(`${d.name} download failed ${res.status}`);

			const filePath = `${SNAPSHOT_PATH}/${timestamp}/${d.name}.json`;
			console.log(`[DEBUG] Writing dataset to: ${filePath}`);
			const file = createWriteStream(filePath);
			await pipeline(res.body as unknown as NodeJS.ReadableStream, file);
			console.log(`[DEBUG] Finished writing: ${filePath}`);
		}
		console.log(`[DEBUG] All datasets fetched for timestamp: ${timestamp}`);
	} catch (err) {
		console.error("[ERROR] fetchDatasets failed:", err);
		throw err;
	}
}
