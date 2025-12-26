/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup.
 * Fails fast with clear error messages.
 */

interface EnvConfig {
  // Required for core functionality
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Optional - B2 archiving
  B2_KEY_ID?: string;
  B2_APP_KEY?: string;
  B2_BUCKET?: string;

  // Environment identifier
  ENVIRONMENT: 'local' | 'staging' | 'production';
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables
  if (!process.env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  // Validate URL format
  if (process.env.SUPABASE_URL && !isValidUrl(process.env.SUPABASE_URL)) {
    errors.push('SUPABASE_URL must be a valid URL');
  }

  // B2 validation - all or nothing
  const b2Vars = [process.env.B2_KEY_ID, process.env.B2_APP_KEY, process.env.B2_BUCKET];
  const b2Defined = b2Vars.filter(Boolean).length;
  if (b2Defined > 0 && b2Defined < 3) {
    errors.push(
      'B2 configuration incomplete: either set all B2_KEY_ID, B2_APP_KEY, B2_BUCKET or none'
    );
  }

  // Environment validation
  const env = process.env.ENVIRONMENT || 'local';
  if (!['local', 'staging', 'production'].includes(env)) {
    errors.push(`ENVIRONMENT must be 'local', 'staging', or 'production' (got '${env}')`);
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    for (const error of errors) {
      console.error(`   • ${error}`);
    }
    console.error('\n');
    process.exit(1);
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    B2_KEY_ID: process.env.B2_KEY_ID,
    B2_APP_KEY: process.env.B2_APP_KEY,
    B2_BUCKET: process.env.B2_BUCKET,
    ENVIRONMENT: env as EnvConfig['ENVIRONMENT'],
  };
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Validate on import
export const env = validateEnv();

// Log environment on startup (without secrets)
console.log(`\n🔧 Environment: ${env.ENVIRONMENT}`);
console.log(`   Supabase: ${env.SUPABASE_URL}`);
console.log(`   B2 Archiving: ${env.B2_KEY_ID ? 'enabled' : 'disabled'}\n`);
