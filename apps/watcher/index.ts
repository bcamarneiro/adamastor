import { formatISO } from "date-fns";
import { fetchDatasets } from "./src/fetcher.js";
import { validate } from "./src/validator.js";
import { diffFiles } from "./src/diff.js";
import { sha256 } from "./src/hash.js";
import { makeLatest } from "./src/normalise.js";
import { uploadFile } from "./src/upload-b2.js";
import { DATASETS, SNAPSHOT_PATH } from "./src/config.js";
import schemaBase from "./schemas/informacao_base.schema.json";
import schemaAgenda from "./schemas/agenda.schema.json";
import schemaAtv from "./schemas/atividades.schema.json";
import schemaIniciativas from "./schemas/iniciativas.schema.json";

(async () => {
	try {
		console.log("[DEBUG] Script started");
		const ts = formatISO(new Date(), { representation: "complete" }).replace(
			/[:]/g,
			"-",
		);
		console.log(`[DEBUG] Timestamp generated: ${ts}`);
		await fetchDatasets(ts);
		console.log(`[DEBUG] Datasets fetched for timestamp: ${ts}`);

		// validate & hash
		for (const d of DATASETS) {
			const p = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
			const schema =
				d.name === "informacao_base"
					? schemaBase
					: d.name === "agenda"
						? schemaAgenda
						: d.name === "atividades"
							? schemaAtv as any
							: schemaIniciativas as any;
			console.log(`[DEBUG] Validating ${d.name} with schema`);
			await validate(p, schema);

			console.log(`[DEBUG] Calculating sha256 for ${d.name}`);
			const checksum = await sha256(p);
			console.log(`${d.name} • sha256 ${checksum}`);
		}

		// compare with previous snapshot
		// (left as exercise – list snapshot folder, pick newest-1, run diffFiles)

		// upload raw files & index.json
		for (const d of DATASETS) {
			const local = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
			const remote = `${ts}/${d.name}.json`;
			console.log(`[DEBUG] Uploading ${local} to ${remote}`);
			await uploadFile(local, remote);
		}

		// make "latest"
		for (const d of DATASETS) {
			const local = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
			console.log(`[DEBUG] Making latest for ${d.name}`);
			await makeLatest(local, d.name);
		}
		console.log("[DEBUG] Script completed successfully");
	} catch (err) {
		console.error("[ERROR] Script failed:", err);
	}
})();
