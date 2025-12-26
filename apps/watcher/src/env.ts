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

  // Capture values to avoid repeated access
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Required variables
  if (!supabaseUrl) {
    errors.push('SUPABASE_URL is required');
  }
  if (!supabaseKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  // Validate URL format
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
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
  const envValue = process.env.ENVIRONMENT || 'local';
  if (!['local', 'staging', 'production'].includes(envValue)) {
    errors.push(`ENVIRONMENT must be 'local', 'staging', or 'production' (got '${envValue}')`);
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    for (const error of errors) {
      console.error(`   • ${error}`);
    }
    console.error('\n');
    process.exit(1);
  }

  // At this point, supabaseUrl and supabaseKey are guaranteed to be defined
  // because we would have exited above if they weren't
  return {
    SUPABASE_URL: supabaseUrl as string,
    SUPABASE_SERVICE_ROLE_KEY: supabaseKey as string,
    B2_KEY_ID: process.env.B2_KEY_ID,
    B2_APP_KEY: process.env.B2_APP_KEY,
    B2_BUCKET: process.env.B2_BUCKET,
    ENVIRONMENT: envValue as EnvConfig['ENVIRONMENT'],
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
