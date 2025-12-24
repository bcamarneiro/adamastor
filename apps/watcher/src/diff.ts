// src/diff.ts
import { readFile } from "node:fs/promises";
import { diff } from "deep-diff";

export async function diffFiles(oldF: string, newF: string) {
	try {
		console.log(`[DEBUG] Diffing files: ${oldF} vs ${newF}`);
		const [oldJ, newJ] = await Promise.all([
			readFile(oldF, "utf8"),
			readFile(newF, "utf8"),
		]);
		console.log(`[DEBUG] Files read, running diff`);
		const result = diff(JSON.parse(oldJ), JSON.parse(newJ)); // undefined if identical
		console.log(`[DEBUG] Diff result:`, result);
		return result;
	} catch (err) {
		console.error(`[ERROR] diffFiles failed:`, err);
		throw err;
	}
}
