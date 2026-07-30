import { describe, expect, it } from 'vitest';
import { computeAlerts, createGradeChangeAlert, detectGradeChange } from './gradeChangeNotifier';
import type { GradeChangeAlert } from './types';

describe('detectGradeChange', () => {
  it('returns null when grade stays the same', () => {
    expect(detectGradeChange(80, 82)).toBeNull();
    expect(detectGradeChange(90, 91)).toBeNull();
    expect(detectGradeChange(45, 48)).toBeNull();
    expect(detectGradeChange(10, 20)).toBeNull();
  });

  it('detects a downward grade change', () => {
    const result = detectGradeChange(92, 80);
    expect(result).not.toBeNull();
    expect(result).toEqual({
      oldGrade: 'A',
      newGrade: 'B',
      direction: 'down',
    });
  });

  it('detects an upward grade change', () => {
    const result = detectGradeChange(55, 72);
    expect(result).not.toBeNull();
    expect(result).toEqual({
      oldGrade: 'C',
      newGrade: 'B',
      direction: 'up',
    });
  });

  it('detects a multi-tier drop (A to D)', () => {
    const result = detectGradeChange(90, 42);
    expect(result).toEqual({
      oldGrade: 'A',
      newGrade: 'D',
      direction: 'down',
    });
  });

  it('detects a multi-tier rise (F to C)', () => {
    const result = detectGradeChange(25, 60);
    expect(result).toEqual({
      oldGrade: 'F',
      newGrade: 'C',
      direction: 'up',
    });
  });

  it('handles boundary scores at grade thresholds', () => {
    // A boundary: 85 is A, 84 is B
    expect(detectGradeChange(85, 84)).toEqual({
      oldGrade: 'A',
      newGrade: 'B',
      direction: 'down',
    });
    // B boundary: 70 is B, 69 is C
    expect(detectGradeChange(69, 70)).toEqual({
      oldGrade: 'C',
      newGrade: 'B',
      direction: 'up',
    });
  });
});

describe('createGradeChangeAlert', () => {
  it('creates a valid alert payload', () => {
    const alert = createGradeChangeAlert('deputy-1', 'João Silva', {
      oldGrade: 'A',
      newGrade: 'B',
      direction: 'down',
    });

    expect(alert.deputyId).toBe('deputy-1');
    expect(alert.deputyName).toBe('João Silva');
    expect(alert.change.oldGrade).toBe('A');
    expect(alert.change.newGrade).toBe('B');
    expect(alert.change.direction).toBe('down');
    expect(alert.id).toMatch(/^gca-deputy-1-/);
    expect(alert.timestamp).toBeDefined();
    expect(() => new Date(alert.timestamp)).not.toThrow();
  });
});

describe('computeAlerts', () => {
  const watcherConfig = { deputyIds: ['d1', 'd2', 'd3'] };
  const oldScores = { d1: 90, d2: 60, d3: 30 };
  const names = { d1: 'Deputy One', d2: 'Deputy Two', d3: 'Deputy Three' };

  it('returns alerts only for deputies whose grade changed', () => {
    // d1: 90→75  A→B down; d2: 60→72  C→B up; d3: 30→35  F→F same
    const newScores = { d1: 75, d2: 72, d3: 35 };

    const alerts = computeAlerts(oldScores, newScores, names, watcherConfig);

    expect(alerts).toHaveLength(2);
    expect(alerts[0].deputyId).toBe('d1');
    expect(alerts[0].change).toEqual({
      oldGrade: 'A',
      newGrade: 'B',
      direction: 'down',
    });
    expect(alerts[1].deputyId).toBe('d2');
    expect(alerts[1].change).toEqual({
      oldGrade: 'C',
      newGrade: 'B',
      direction: 'up',
    });
  });

  it('returns empty array when no grades changed', () => {
    const newScores = { d1: 88, d2: 60, d3: 25 }; // all same grades
    const alerts = computeAlerts(oldScores, newScores, names, watcherConfig);
    expect(alerts).toHaveLength(0);
  });

  it('skips deputies missing from old or new scores', () => {
    const alerts = computeAlerts(
      { d1: 90 }, // missing d2, d3
      { d1: 75, d2: 60, d3: 30 },
      names,
      watcherConfig
    );
    // Only d1 has both old and new scores
    expect(alerts).toHaveLength(1);
    expect(alerts[0].deputyId).toBe('d1');
  });

  it('skips deputies with no name', () => {
    const alerts = computeAlerts(
      oldScores,
      { d1: 75, d2: 65, d3: 50 },
      { d1: 'Deputy One' }, // missing d2, d3 names
      watcherConfig
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].deputyId).toBe('d1');
  });

  it('returns empty array for empty watch config', () => {
    const emptyConfig = { deputyIds: [] };
    const alerts = computeAlerts(oldScores, {}, names, emptyConfig);
    expect(alerts).toHaveLength(0);
  });
});

describe('alert payload structure validation', () => {
  it('contains all required fields for downstream consumers', () => {
    const alert: GradeChangeAlert = createGradeChangeAlert('d99', 'Test Deputy', {
      oldGrade: 'B',
      newGrade: 'A',
      direction: 'up',
    });

    // Validate the shape downstream consumers expect
    const payload = JSON.parse(JSON.stringify(alert));
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('deputyId');
    expect(payload).toHaveProperty('deputyName');
    expect(payload).toHaveProperty('change.oldGrade');
    expect(payload).toHaveProperty('change.newGrade');
    expect(payload).toHaveProperty('change.direction');
    expect(payload).toHaveProperty('timestamp');
  });
});
