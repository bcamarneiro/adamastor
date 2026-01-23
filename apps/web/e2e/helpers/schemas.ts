/**
 * E2E Schema Validators
 *
 * These validators ensure that API responses match expected data structures.
 * They're used in data contract tests to validate that the rendered UI
 * receives correctly shaped data from the API/database.
 *
 * See apps/web/e2e/data-contracts/README.md for usage examples.
 */

import { expect } from '@playwright/test';

/**
 * Helper to safely access properties of unknown objects for type checking
 */
function getProp(obj: unknown, prop: string): unknown {
  return (obj as Record<string, unknown>)[prop];
}

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
    expect(typeof getProp(deputy, 'id')).toBe('string');
    expect(typeof getProp(deputy, 'name')).toBe('string');
    expect(typeof getProp(deputy, 'external_id')).toBe('string');
    expect(typeof getProp(deputy, 'is_active')).toBe('boolean');

    // Optional fields that may be present
    if (getProp(deputy, 'party_id')) {
      expect(typeof getProp(deputy, 'party_id')).toBe('string');
    }
    if (getProp(deputy, 'district_id')) {
      expect(typeof getProp(deputy, 'district_id')).toBe('string');
    }
    if (getProp(deputy, 'short_name')) {
      expect(typeof getProp(deputy, 'short_name')).toBe('string');
    }
  },

  /**
   * Validates a deputy object with stats from deputy_stats join
   */
  validateWithStats(deputy: unknown) {
    this.validate(deputy);

    // Stats fields (from deputy_stats table)
    if (getProp(deputy, 'national_rank') !== undefined) {
      expect(typeof getProp(deputy, 'national_rank')).toBe('number');
    }
    if (getProp(deputy, 'work_score') !== undefined) {
      expect(typeof getProp(deputy, 'work_score')).toBe('number');
    }
    if (getProp(deputy, 'grade') !== undefined) {
      expect(typeof getProp(deputy, 'grade')).toBe('string');
      expect(getProp(deputy, 'grade')).toMatch(/^[A-F]$/);
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
    expect(typeof getProp(party, 'id')).toBe('string');
    expect(typeof getProp(party, 'acronym')).toBe('string');
    expect(typeof getProp(party, 'name')).toBe('string');
    expect(typeof getProp(party, 'external_id')).toBe('string');

    // Optional fields
    const color = getProp(party, 'color');
    if (color) {
      expect(typeof color).toBe('string');
      // Optionally validate hex color format
      if (typeof color === 'string' && color.startsWith('#')) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
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
    expect(typeof getProp(district, 'id')).toBe('string');
    expect(typeof getProp(district, 'name')).toBe('string');
    expect(Array.isArray(getProp(district, 'postal_prefixes'))).toBe(true);

    // Optional fields
    if (getProp(district, 'deputy_count') !== undefined) {
      expect(typeof getProp(district, 'deputy_count')).toBe('number');
    }
  },
};

/**
 * Initiative Schema Validator
 *
 * Validates initiative data from the initiatives JSON API (Vercel Blob Storage).
 * Raw Portuguese field names from the parliamentary API.
 */
export const InitiativeSchema = {
  /**
   * Validates an initiative object has required fields and correct types
   */
  validate(initiative: unknown) {
    // Required fields
    expect(initiative, 'Initiative object should exist').toBeTruthy();
    expect(initiative).toHaveProperty('IniId');
    expect(initiative).toHaveProperty('IniTitulo');
    expect(initiative).toHaveProperty('IniNr');

    // Type checks
    expect(typeof getProp(initiative, 'IniId')).toBe('string');
    expect(typeof getProp(initiative, 'IniTitulo')).toBe('string');
    expect(typeof getProp(initiative, 'IniNr')).toBe('string');

    // Optional fields that may be present
    if (getProp(initiative, 'IniTipo')) {
      expect(typeof getProp(initiative, 'IniTipo')).toBe('string');
    }
    if (getProp(initiative, 'IniEventos')) {
      expect(Array.isArray(getProp(initiative, 'IniEventos'))).toBe(true);
    }
    if (getProp(initiative, 'IniDescTipo')) {
      expect(typeof getProp(initiative, 'IniDescTipo')).toBe('string');
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
    expect(typeof getProp(stats, 'id')).toBe('string');
    expect(typeof getProp(stats, 'deputy_id')).toBe('string');

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
      if (getProp(stats, field) !== undefined) {
        expect(typeof getProp(stats, field)).toBe('number');
      }
    }

    // Decimal fields
    if (getProp(stats, 'attendance_rate') !== undefined) {
      expect(typeof getProp(stats, 'attendance_rate')).toBe('number');
    }
    if (getProp(stats, 'work_score') !== undefined) {
      expect(typeof getProp(stats, 'work_score')).toBe('number');
    }

    // Grade field
    if (getProp(stats, 'grade')) {
      expect(typeof getProp(stats, 'grade')).toBe('string');
      expect(getProp(stats, 'grade')).toMatch(/^[A-F]$/);
    }

    // Ranking fields
    if (getProp(stats, 'district_rank') !== undefined) {
      expect(typeof getProp(stats, 'district_rank')).toBe('number');
    }
    if (getProp(stats, 'national_rank') !== undefined) {
      expect(typeof getProp(stats, 'national_rank')).toBe('number');
    }
  },
};

/**
 * Helper function to validate arrays of items
 */
export function validateArray(
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
