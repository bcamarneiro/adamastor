import { readFile, writeFile } from 'node:fs/promises';
import Ajv from 'ajv';
import type { JSONSchemaType } from 'ajv';
import generateSchema from 'generate-schema';

export async function validate(path: string, schema: JSONSchemaType<any>) {
  try {
    console.log(`[DEBUG] Validating file: ${path}`);
    // Configure Ajv to not validate schema against meta-schema
    const ajv = new (Ajv as any).default({
      allErrors: true,
      validateSchema: false, // Skip validating schema against meta-schema
    });
    const validate = ajv.compile(schema);
    const raw = JSON.parse(await readFile(path, 'utf8'));

    if (!validate(raw)) {
      console.error(`[ERROR] Validation failed for ${path}:`, validate.errors);
      throw new Error(JSON.stringify(validate.errors, null, 2));
    }
    console.log(`[DEBUG] Validation passed for ${path}`);
  } catch (err) {
    console.error(`[ERROR] validate failed for ${path}:`, err);
    throw err;
  }
}

export async function createSchemaFromFile(jsonPath: string, schemaPath: string) {
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  const schema = generateSchema.json(jsonPath, data);
  await writeFile(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`Schema written to ${schemaPath}`);
}
