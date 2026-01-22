/**
 * E2E Schema Validators
 *
 * These validators ensure that API responses match expected data structures.
 * They're used in data contract tests to validate that the rendered UI
 * receives correctly shaped data from the API/database.
 *
 * See apps/web/e2e/data-contracts/README.md for usage examples.
 *
 * Note: This file intentionally uses `as any` for runtime type validation
 * of untyped API responses in E2E tests.
 */

// biome-ignore lint/suspicious/noExplicitAny: This file validates unknown API responses at runtime
import { expect } from '@playwright/test';

/**
 * Deputy Schema Validator
 *
 * Validates deputy data from Supabase deputies table.
 * Fields based on: supabase/migrations/20241224000001_initial_schema.sql
 */
export const DeputySchema = {
  /**
   * Validates a deputy object has required fields and correct types
   */
  validate(deputy: unknown) {
    // Required fields
    expect(deputy, 'Deputy object should exist').toBeTruthy();
    expect(deputy).toHaveProperty('id');
    expect(deputy).toHaveProperty('name');
    expect(deputy).toHaveProperty('external_id');
    expect(deputy).toHaveProperty('is_active');

    // Type checks
    expect(typeof (deputy as any).id).toBe('string');
    expect(typeof (deputy as any).name).toBe('string');
    expect(typeof (deputy as any).external_id).toBe('string');
    expect(typeof (deputy as any).is_active).toBe('boolean');

    // Optional fields that may be present
    if ((deputy as any).party_id) {
      expect(typeof (deputy as any).party_id).toBe('string');
    }
    if ((deputy as any).district_id) {
      expect(typeof (deputy as any).district_id).toBe('string');
    }
    if ((deputy as any).short_name) {
      expect(typeof (deputy as any).short_name).toBe('string');
    }
  },

  /**
   * Validates a deputy object with stats from deputy_stats join
   */
  validateWithStats(deputy: unknown) {
    this.validate(deputy);

    // Stats fields (from deputy_stats table)
    if ((deputy as any).national_rank !== undefined) {
      expect(typeof (deputy as any).national_rank).toBe('number');
    }
    if ((deputy as any).work_score !== undefined) {
      expect(typeof (deputy as any).work_score).toBe('number');
    }
    if ((deputy as any).grade !== undefined) {
      expect(typeof (deputy as any).grade).toBe('string');
      expect((deputy as any).grade).toMatch(/^[A-F]$/);
    }
  },
};

/**
 * Party Schema Validator
 *
 * Validates party data from Supabase parties table.
 * Fields based on: supabase/migrations/20241224000001_initial_schema.sql
 */
export const PartySchema = {
  /**
   * Validates a party object has required fields and correct types
   */
  validate(party: unknown) {
    // Required fields
    expect(party, 'Party object should exist').toBeTruthy();
    expect(party).toHaveProperty('id');
    expect(party).toHaveProperty('acronym');
    expect(party).toHaveProperty('name');
    expect(party).toHaveProperty('external_id');

    // Type checks
    expect(typeof (party as any).id).toBe('string');
    expect(typeof (party as any).acronym).toBe('string');
    expect(typeof (party as any).name).toBe('string');
    expect(typeof (party as any).external_id).toBe('string');

    // Optional fields
    if ((party as any).color) {
      expect(typeof (party as any).color).toBe('string');
      // Optionally validate hex color format
      if ((party as any).color.startsWith('#')) {
        expect((party as any).color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  },
};

/**
 * District Schema Validator
 *
 * Validates district data from Supabase districts table.
 * Fields based on: supabase/migrations/20241224000001_initial_schema.sql
 */
export const DistrictSchema = {
  /**
   * Validates a district object has required fields and correct types
   */
  validate(district: unknown) {
    // Required fields
    expect(district, 'District object should exist').toBeTruthy();
    expect(district).toHaveProperty('id');
    expect(district).toHaveProperty('name');
    expect(district).toHaveProperty('postal_prefixes');

    // Type checks
    expect(typeof (district as any).id).toBe('string');
    expect(typeof (district as any).name).toBe('string');
    expect(Array.isArray((district as any).postal_prefixes)).toBe(true);

    // Optional fields
    if ((district as any).deputy_count !== undefined) {
      expect(typeof (district as any).deputy_count).toBe('number');
    }
  },
};

/**
 * Initiative Schema Validator
 *
 * Validates initiative data from Supabase initiatives table.
 * Fields based on: supabase/migrations/20241224000001_initial_schema.sql
 */
export const InitiativeSchema = {
  /**
   * Validates an initiative object has required fields and correct types
   */
  validate(initiative: unknown) {
    // Required fields
    expect(initiative, 'Initiative object should exist').toBeTruthy();
    expect(initiative).toHaveProperty('id');
    expect(initiative).toHaveProperty('title');
    expect(initiative).toHaveProperty('external_id');

    // Type checks
    expect(typeof (initiative as any).id).toBe('string');
    expect(typeof (initiative as any).title).toBe('string');
    expect(typeof (initiative as any).external_id).toBe('string');

    // Optional fields
    if ((initiative as any).number) {
      expect(typeof (initiative as any).number).toBe('string');
    }
    if ((initiative as any).type) {
      expect(typeof (initiative as any).type).toBe('string');
    }
    if ((initiative as any).status) {
      expect(typeof (initiative as any).status).toBe('string');
    }
  },
};

/**
 * Deputy Stats Schema Validator
 *
 * Validates stats data from deputy_stats table.
 * Fields based on: supabase/migrations/20241224000001_initial_schema.sql
 */
export const DeputyStatsSchema = {
  /**
   * Validates a deputy_stats object has required fields and correct types
   */
  validate(stats: unknown) {
    // Required fields
    expect(stats, 'Stats object should exist').toBeTruthy();
    expect(stats).toHaveProperty('id');
    expect(stats).toHaveProperty('deputy_id');

    // Type checks
    expect(typeof (stats as any).id).toBe('string');
    expect(typeof (stats as any).deputy_id).toBe('string');

    // Numeric fields
    const numericFields = [
      'total_sessions',
      'sessions_attended',
      'total_votes',
      'votes_cast',
      'proposal_count',
      'intervention_count',
      'question_count',
    ];

    for (const field of numericFields) {
      if ((stats as any)[field] !== undefined) {
        expect(typeof (stats as any)[field]).toBe('number');
      }
    }

    // Decimal fields
    if ((stats as any).attendance_rate !== undefined) {
      expect(typeof (stats as any).attendance_rate).toBe('number');
    }
    if ((stats as any).work_score !== undefined) {
      expect(typeof (stats as any).work_score).toBe('number');
    }

    // Grade field
    if ((stats as any).grade) {
      expect(typeof (stats as any).grade).toBe('string');
      expect((stats as any).grade).toMatch(/^[A-F]$/);
    }

    // Ranking fields
    if ((stats as any).district_rank !== undefined) {
      expect(typeof (stats as any).district_rank).toBe('number');
    }
    if ((stats as any).national_rank !== undefined) {
      expect(typeof (stats as any).national_rank).toBe('number');
    }
  },
};

/**
 * Helper function to validate arrays of items
 */
export function validateArray<T>(
  items: unknown[],
  validator: { validate: (item: unknown) => void },
  minItems = 1
) {
  expect(Array.isArray(items), 'Should be an array').toBe(true);
  expect(items.length, `Should have at least ${minItems} items`).toBeGreaterThanOrEqual(minItems);

  // Validate first few items (sample-based validation)
  const sampleSize = Math.min(3, items.length);
  for (let i = 0; i < sampleSize; i++) {
    try {
      validator.validate(items[i]);
    } catch (error) {
      throw new Error(`Validation failed for item at index ${i}: ${(error as Error).message}`);
    }
  }
}
