/**
 * Watcher Configuration
 *
 * All tunable parameters for the data pipeline.
 * Environment variables can override defaults.
 */

// =============================================================================
// DATA SOURCES
// =============================================================================

// XVII Legislature (current) - URLs obtained from parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx
export const DATASETS = [
  {
    name: 'informacao_base',
    url: 'https://app.parlamento.pt/webutils/docs/doc.txt?path=a4zfhVMRlkdx8PM4w%2fg1C1Vt1TLL3nxEyDWBwgqjBdJ7w%2f%2bbRwjvq2lIPr1xRzJ6DBy%2fOxQCKfWDla%2fScSjS6%2f0N3a%2b%2b%2bTVRcUvCJTkFrTAUT%2bpzIFRAScSKhiWv2HGWkAHIxlwTIeOsSOOsrXmbVE%2bHE%2fHLJ6RWbSsJBaLWq70lF4rBy8G6GbdPHdrrdiatO%2fCimTiuyO8Wki6C7zu5Klq5f53YZ%2b4MtX8FF5lC1pyiQrC%2bwSVBcu%2brHigPkI56fz8xBGvxVgoQ0nQdAuby1qmhEyYT6RCxaQAqbqv0m70pJF19SyzE62kUF%2fYRio8PiC5DjRA4%2b2eF1X7FfO4s7Bfcq7lsR9LR2PCbXn9zBNQ9mqEnp0H%2brT%2f5vD%2fgcT%2bzF3SPcKfuZKhhDvK1cBgse9ktAzWSZxzzqgCqsUeQ760%3d&fich=InformacaoBaseXVII_json.txt&Inline=true',
  },
  {
    name: 'agenda',
    url: 'https://app.parlamento.pt/webutils/docs/doc.txt?path=g25ZKRvxj7E%2bCuDT3BoxJKbdRNwmcYXtDyTuONx177jIzjV1iQEe7XWX%2b7%2fJUNBH44hpZdfF4HzOP16W6E0lR8eot3IlY7TgTVcWImO0oJgRev1hYgkUTv5d65p0xnT1CrxFg94PU28ExjUn%2fis5CM6y4exOfKkT2facldXDSymtw8B925QnPFu3bGHaUy3tNBWgcuBTKioEyw1AGDmt2RGPiQL0IkviQhm89hMl8Giho6fBjqvYCNJUtOrViFRa7JANbUzfcTwv3wQMaXqgEJXPmJpXXNrehBlmZz%2fgsK7xX93pnvh5Hd%2f6vTFp8fiFqY6rFXSHedRs7x0%2blGrZVyCL5GHNzr0kx9%2fTn7HuAn5LRjPAHZzIn32e70j2ejDTmluroJqE%2bPSjuMirn%2bWOOw%3d%3d&fich=AgendaParlamentar_json.txt&Inline=true',
  },
  {
    name: 'atividades',
    url: 'https://app.parlamento.pt/webutils/docs/doc.txt?path=e1YJBaCJaLQK8BASoFHdlARZwZA5hyhPh5vP0APddrwNl69a1wHYpmA3RQoAqxhbXnLIszOaHdfWRZHIIlZaMkLnjq1ZCO2YGG5GKoYbRWmrGbDBP9i6aup%2fDmNgFv8k7l8z%2bBFOZTjUtIxu%2bNZVfT67IVFOQN%2bj2aJvKpDTqr5IQ67%2ffrTpoFYo%2b19eDltEPk%2ftAA8dPgHIjmnFnFt8%2f6%2bFRyowASGEjWOPgVSAW%2bY2kRvgIl5f07BcTYq%2fp7PMVR8MRccoEgv6dwCvaj0VGt2ZrJUPgaAbvV0Z06lWk%2boGu6MFb3kAQnX1kFWn33d2rE64nk7zDYlXd18EAGj6c3UQsj4UtT%2fbNR0VXC6Z%2fmc%3d&fich=AtividadesXVII_json.txt&Inline=true',
  },
  {
    name: 'iniciativas',
    url: 'https://app.parlamento.pt/webutils/docs/doc.txt?path=Yz8kckc%2fHKUrwsW5K50QhxjWY9xUh9OHGQI1m8LzCYqid4%2bQA61kIcK%2fkcXn0ch3QBk8i38ciIwq8%2b5WlsgEmok3%2fiP%2fmgbCMayFdyVZziZOuis%2bEQjEB4UqSyViYoIt7yC5YLIdbQtXXB6u2UedPJ%2bxanNa0TetcHCXLoWeDxEGMn5Wc8XVaSuF4g%2ftt9JVkxpA4RelGdYOw30DJNx25X7u%2bsw3LsDCKpRYtb9X3dYPeQ6aO3162M%2bFWnYaf32NwiTs7j7qym%2f%2bI%2bfA2JUpan9A3%2fcQNnVarImiljhv6X1vGI1h%2fPxi0PtQPKg8ffPTXdFLok%2fzeZDpprEEeW34axU6%2b6YFKcmH3bAm%2fssYCoc%3d&fich=IniciativasXVII_json.txt&Inline=true',
  },
];

// =============================================================================
// FILE PATHS
// =============================================================================

export const SNAPSHOT_PATH = 'snapshots'; // local cache dir
export const BUCKET = process.env.B2_BUCKET;

// =============================================================================
// HTTP & SCRAPING
// =============================================================================

export const POLITENESS_UA = 'parl-watch-bot (+your@email)';

export const HTTP_CONFIG = {
  /** Default timeout for HTTP requests in ms */
  timeout: Number(process.env.HTTP_TIMEOUT) || 30000,
  /** User agent for scraping requests */
  userAgent: process.env.USER_AGENT || POLITENESS_UA,
} as const;

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxRetries: Number(process.env.MAX_RETRIES) || 3,
  /** Base delay between retries in ms (exponential backoff) */
  baseDelayMs: Number(process.env.RETRY_BASE_DELAY) || 1000,
  /** Maximum delay between retries in ms */
  maxDelayMs: Number(process.env.RETRY_MAX_DELAY) || 30000,
} as const;

// =============================================================================
// BATCH PROCESSING
// =============================================================================

export const BATCH_CONFIG = {
  /** Database upsert batch size */
  dbBatchSize: Number(process.env.DB_BATCH_SIZE) || 50,
  /** Photo download batch size (parallel requests) */
  photoBatchSize: Number(process.env.PHOTO_BATCH_SIZE) || 10,
  /** Delay between batches in ms */
  batchDelayMs: Number(process.env.BATCH_DELAY) || 100,
  /** Delay between photo batches in ms */
  photoBatchDelayMs: Number(process.env.PHOTO_BATCH_DELAY) || 500,
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMIT_CONFIG = {
  /** Delay between API calls to Parliament in ms */
  parliamentApiDelayMs: Number(process.env.PARLIAMENT_API_DELAY) || 200,
  /** Delay between scraping requests in ms */
  scrapeDelayMs: Number(process.env.SCRAPE_DELAY) || 1000,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
  /** Enable photo syncing from Parliament */
  syncPhotos: process.env.SYNC_PHOTOS !== 'false',
  /** Enable attendance scraping */
  syncAttendance: process.env.SYNC_ATTENDANCE !== 'false',
  /** Enable B2 archiving (auto-detected from env) */
  archiveToB2: Boolean(process.env.B2_KEY_ID && process.env.B2_APP_KEY && process.env.B2_BUCKET),
  /** Enable verbose logging */
  verboseLogging: process.env.VERBOSE === 'true',
} as const;

// =============================================================================
// VALIDATION THRESHOLDS
// =============================================================================

export const VALIDATION_CONFIG = {
  /** Minimum expected deputies count */
  minDeputies: Number(process.env.MIN_DEPUTIES) || 200,
  /** Minimum expected parties count */
  minParties: Number(process.env.MIN_PARTIES) || 5,
  /** Maximum expected work score */
  maxWorkScore: 200,
} as const;
