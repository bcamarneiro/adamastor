import { describe, expect, it } from 'bun:test';
import {
  BATCH_CONFIG,
  DATASETS,
  FEATURES,
  HTTP_CONFIG,
  RATE_LIMIT_CONFIG,
  RETRY_CONFIG,
  SNAPSHOT_PATH,
  VALIDATION_CONFIG,
} from './config.js';

describe('config', () => {
  describe('DATASETS', () => {
    it('should have all required datasets', () => {
      const datasetNames = DATASETS.map((d) => d.name);

      expect(datasetNames).toContain('informacao_base');
      expect(datasetNames).toContain('iniciativas');
      expect(datasetNames).toContain('atividades');
      expect(datasetNames).toContain('agenda');
    });

    it('should have valid URLs', () => {
      for (const dataset of DATASETS) {
        expect(dataset.url).toMatch(/^https:\/\//);
        expect(dataset.url).toContain('parlamento.pt');
      }
    });
  });

  describe('SNAPSHOT_PATH', () => {
    it('should be defined', () => {
      expect(SNAPSHOT_PATH).toBe('snapshots');
    });
  });

  describe('HTTP_CONFIG', () => {
    it('should have reasonable timeout', () => {
      expect(HTTP_CONFIG.timeout).toBeGreaterThanOrEqual(5000);
      expect(HTTP_CONFIG.timeout).toBeLessThanOrEqual(120000);
    });

    it('should have user agent', () => {
      expect(HTTP_CONFIG.userAgent).toBeTruthy();
    });
  });

  describe('RETRY_CONFIG', () => {
    it('should have sensible retry values', () => {
      expect(RETRY_CONFIG.maxRetries).toBeGreaterThanOrEqual(1);
      expect(RETRY_CONFIG.maxRetries).toBeLessThanOrEqual(10);
      expect(RETRY_CONFIG.baseDelayMs).toBeGreaterThan(0);
      expect(RETRY_CONFIG.maxDelayMs).toBeGreaterThan(RETRY_CONFIG.baseDelayMs);
    });
  });

  describe('BATCH_CONFIG', () => {
    it('should have sensible batch sizes', () => {
      expect(BATCH_CONFIG.dbBatchSize).toBeGreaterThan(0);
      expect(BATCH_CONFIG.dbBatchSize).toBeLessThanOrEqual(1000);
      expect(BATCH_CONFIG.photoBatchSize).toBeGreaterThan(0);
      expect(BATCH_CONFIG.photoBatchSize).toBeLessThanOrEqual(50);
    });
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('should have non-zero delays', () => {
      expect(RATE_LIMIT_CONFIG.parliamentApiDelayMs).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIG.scrapeDelayMs).toBeGreaterThan(0);
    });
  });

  describe('FEATURES', () => {
    it('should have boolean feature flags', () => {
      expect(typeof FEATURES.syncPhotos).toBe('boolean');
      expect(typeof FEATURES.syncAttendance).toBe('boolean');
      expect(typeof FEATURES.archiveToB2).toBe('boolean');
      expect(typeof FEATURES.verboseLogging).toBe('boolean');
    });
  });

  describe('VALIDATION_CONFIG', () => {
    it('should have reasonable thresholds', () => {
      // Portugal parliament has 230 deputies
      expect(VALIDATION_CONFIG.minDeputies).toBeGreaterThanOrEqual(100);
      expect(VALIDATION_CONFIG.minDeputies).toBeLessThanOrEqual(250);

      // There are typically 5-10 parties
      expect(VALIDATION_CONFIG.minParties).toBeGreaterThanOrEqual(3);
      expect(VALIDATION_CONFIG.minParties).toBeLessThanOrEqual(20);
    });
  });
});
