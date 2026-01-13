import { readFile, writeFile } from 'node:fs/promises';
import Ajv from 'ajv';
import type { JSONSchemaType } from 'ajv';
import generateSchema from 'generate-schema';

export interface ValidateOptions {
  /** If false, log validation errors as warnings instead of throwing (default: false) */
  strict?: boolean;
}

export async function validate(
  path: string,
  // biome-ignore lint/suspicious/noExplicitAny: Ajv JSONSchemaType requires generic, unknown not compatible
  schema: JSONSchemaType<any>,
  options: ValidateOptions = {}
) {
  const { strict = false } = options;

  try {
    console.log(`[DEBUG] Validating file: ${path}`);
    // Configure Ajv to not validate schema against meta-schema
    // biome-ignore lint/suspicious/noExplicitAny: Ajv module requires this cast for proper instantiation
    const ajv = new (Ajv as any).default({
      allErrors: true,
      validateSchema: false, // Skip validating schema against meta-schema
    });
    const validate = ajv.compile(schema);
    const raw = JSON.parse(await readFile(path, 'utf8'));

    if (!validate(raw)) {
      const errorCount = validate.errors?.length || 0;
      const errorMsg = `${errorCount} validation error(s) in ${path}`;

      if (strict) {
        console.error(`[ERROR] ${errorMsg}:`, validate.errors);
        throw new Error(JSON.stringify(validate.errors, null, 2));
      }

      // Non-strict mode: log as warning and continue
      console.warn(`[WARN] ${errorMsg}:`);
      console.warn(JSON.stringify(validate.errors, null, 2));
      console.warn('[WARN] Continuing despite validation errors (strict=false)');
      return;
    }

    console.log(`[DEBUG] Validation passed for ${path}`);
  } catch (err) {
    console.error(`[ERROR] validate failed for ${path}:`, err);
    if (strict) {
      throw err;
    }
    console.warn('[WARN] Continuing despite error (strict=false)');
  }
}

export async function createSchemaFromFile(jsonPath: string, schemaPath: string) {
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  const schema = generateSchema.json(jsonPath, data);
  await writeFile(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`Schema written to ${schemaPath}`);
}
