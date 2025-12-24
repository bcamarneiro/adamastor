import { createHash } from "crypto";
import { readFile } from "node:fs/promises";

export async function sha256(path: string) {
	try {
		console.log(`[DEBUG] Calculating sha256 for: ${path}`);
		const buf = await readFile(path);
		console.log(`[DEBUG] File read for hashing: ${path}`);
		const hash = createHash("sha256").update(buf).digest("hex");
		console.log(`[DEBUG] sha256 for ${path}: ${hash}`);
		return hash;
	} catch (err) {
		console.error(`[ERROR] sha256 failed for ${path}:`, err);
		throw err;
	}
}
