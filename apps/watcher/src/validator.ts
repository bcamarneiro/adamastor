import { readFile, writeFile } from 'node:fs/promises';
import Ajv from 'ajv';
import type { JSONSchemaType } from 'ajv';
import generateSchema from 'generate-schema';

export interface ValidateOptions {
  /** If true, throw errors on validation failure; if false, log warnings and continue (default: false) */
  strict?: boolean;
}

/**
 * Sanitize data to fix known Parliament API inconsistencies.
 * This handles cases where the API returns unexpected types for certain fields.
 */
// biome-ignore lint/suspicious/noExplicitAny: Need to handle arbitrary JSON structures
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  // Fix Audicoes.Assunto: API sometimes returns non-string/non-null values
  if (data.Audicoes && Array.isArray(data.Audicoes)) {
    // biome-ignore lint/suspicious/noExplicitAny: Need to handle arbitrary API response structures
    data.Audicoes = data.Audicoes.map((item: any) => {
      if (item && typeof item === 'object' && 'Assunto' in item) {
        // Coerce invalid Assunto values to null
        if (typeof item.Assunto !== 'string' && item.Assunto !== null) {
          console.warn(
            `[WARN] Coercing invalid Assunto value to null: ${JSON.stringify(item.Assunto)}`
          );
          item.Assunto = null;
        }
      }
      return item;
    });
  }

  return data;
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
    let raw = JSON.parse(await readFile(path, 'utf8'));

    // Sanitize data to handle API inconsistencies
    raw = sanitizeData(raw);

    // Write sanitized data back to file
    await writeFile(path, JSON.stringify(raw, null, 2));

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
