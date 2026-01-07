import { describe, expect, it } from 'vitest';
import type { Initiative } from '@/services/initiatives/useInitiatives';
import {
  areInitiativesRelated,
  buildRelatedInitiativesMap,
  DEFAULT_RELATED_INITIATIVES_LIMIT,
  getRelatedInitiatives,
} from './relatedInitiatives';

// Helper to create mock initiatives with minimal required fields
const createMockInitiative = (
  id: string,
  title: string,
  type: string
): Initiative => ({
  IniId: id,
  IniNr: `NR-${id}`,
  IniTitulo: title,
  description: `Description for ${id}`,
  IniTipo: type,
  IniEventos: [],
});

describe('areInitiativesRelated', () => {
  it('should return true when initiatives have the same type', () => {
    const initiative1 = createMockInitiative('1', 'Tax Reform Bill', 'Lei');
    const initiative2 = createMockInitiative('2', 'Budget Proposal', 'Lei');

    expect(areInitiativesRelated(initiative1, initiative2)).toBe(true);
  });

  it('should return false when initiatives have different types and no shared title words', () => {
    const initiative1 = createMockInitiative('1', 'Tax Reform', 'Lei');
    const initiative2 = createMockInitiative('2', 'Budget Proposal', 'Decreto');

    expect(areInitiativesRelated(initiative1, initiative2)).toBe(false);
  });

  it('should return true when initiatives share a title word (case insensitive)', () => {
    const initiative1 = createMockInitiative('1', 'Climate Change Act', 'Lei');
    const initiative2 = createMockInitiative(
      '2',
      'Environmental climate policy',
      'Decreto'
    );

    expect(areInitiativesRelated(initiative1, initiative2)).toBe(true);
  });

  it('should match title words case-insensitively', () => {
    const initiative1 = createMockInitiative('1', 'EDUCATION Reform', 'Lei');
    const initiative2 = createMockInitiative(
      '2',
      'Primary education funding',
      'Decreto'
    );

    expect(areInitiativesRelated(initiative1, initiative2)).toBe(true);
  });

  it('should match partial word substrings in titles', () => {
    const initiative1 = createMockInitiative('1', 'Tax Policy', 'Lei');
    const initiative2 = createMockInitiative(
      '2',
      'Taxation and Revenue',
      'Decreto'
    );

    // "Tax" should match as a substring of "Taxation"
    expect(areInitiativesRelated(initiative1, initiative2)).toBe(true);
  });

  it('should return true for same type even with different titles', () => {
    const initiative1 = createMockInitiative('1', 'Alpha Beta', 'Projeto');
    const initiative2 = createMockInitiative('2', 'Gamma Delta', 'Projeto');

    expect(areInitiativesRelated(initiative1, initiative2)).toBe(true);
  });
});

describe('getRelatedInitiatives', () => {
  const initiatives: Initiative[] = [
    createMockInitiative('1', 'Tax Reform Bill', 'Lei'),
    createMockInitiative('2', 'Budget Proposal', 'Lei'),
    createMockInitiative('3', 'Environmental Reform Act', 'Decreto'),
    createMockInitiative('4', 'Healthcare Policy', 'Projeto'),
    createMockInitiative('5', 'Tax Credit Initiative', 'Projeto'),
    createMockInitiative('6', 'Education Budget', 'Lei'),
  ];

  it('should exclude the initiative itself from results', () => {
    const target = initiatives[0]; // Tax Reform Bill, Lei
    const related = getRelatedInitiatives(target, initiatives);

    expect(related.every((ini) => ini.IniId !== target.IniId)).toBe(true);
  });

  it('should find related initiatives by type', () => {
    const target = initiatives[0]; // Tax Reform Bill, Lei
    const related = getRelatedInitiatives(target, initiatives);

    // Should find other "Lei" type initiatives
    const leiRelated = related.filter((ini) => ini.IniTipo === 'Lei');
    expect(leiRelated.length).toBeGreaterThan(0);
  });

  it('should find related initiatives by shared title words', () => {
    const target = initiatives[0]; // Tax Reform Bill
    const related = getRelatedInitiatives(target, initiatives);

    // Should find "Tax Credit Initiative" (shares "Tax")
    // Should find "Environmental Reform Act" (shares "Reform")
    const taxRelated = related.some((ini) =>
      ini.IniTitulo.toLowerCase().includes('tax')
    );
    expect(taxRelated).toBe(true);
  });

  it('should respect the default limit of 3', () => {
    const target = initiatives[0];
    const related = getRelatedInitiatives(target, initiatives);

    expect(related.length).toBeLessThanOrEqual(DEFAULT_RELATED_INITIATIVES_LIMIT);
  });

  it('should respect a custom limit', () => {
    const target = initiatives[0];
    const related = getRelatedInitiatives(target, initiatives, 2);

    expect(related.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array when no related initiatives exist', () => {
    const standalone = createMockInitiative(
      '99',
      'Unique Standalone Item',
      'UniqueType'
    );
    const related = getRelatedInitiatives(standalone, initiatives);

    expect(related).toEqual([]);
  });

  it('should return empty array for empty initiatives list', () => {
    const target = initiatives[0];
    const related = getRelatedInitiatives(target, []);

    expect(related).toEqual([]);
  });

  it('should return empty array when only the initiative itself is in the list', () => {
    const target = initiatives[0];
    const related = getRelatedInitiatives(target, [target]);

    expect(related).toEqual([]);
  });

  it('should return all related if fewer than limit exist', () => {
    const smallList: Initiative[] = [
      createMockInitiative('1', 'Alpha One', 'TypeA'),
      createMockInitiative('2', 'Alpha Two', 'TypeA'),
    ];
    const target = smallList[0];
    const related = getRelatedInitiatives(target, smallList, 10);

    expect(related.length).toBe(1);
    expect(related[0].IniId).toBe('2');
  });
});

describe('buildRelatedInitiativesMap', () => {
  const initiatives: Initiative[] = [
    createMockInitiative('1', 'Tax Reform Bill', 'Lei'),
    createMockInitiative('2', 'Budget Proposal', 'Lei'),
    createMockInitiative('3', 'Environmental Policy', 'Decreto'),
    createMockInitiative('4', 'Healthcare Act', 'Projeto'),
  ];

  it('should return a Map with entries for all initiatives', () => {
    const map = buildRelatedInitiativesMap(initiatives);

    expect(map.size).toBe(initiatives.length);
    initiatives.forEach((ini) => {
      expect(map.has(ini.IniId)).toBe(true);
    });
  });

  it('should map each initiative to its related initiatives array', () => {
    const map = buildRelatedInitiativesMap(initiatives);

    // Initiative 1 (Lei) should be related to Initiative 2 (Lei)
    const related1 = map.get('1');
    expect(related1).toBeDefined();
    expect(related1!.some((ini) => ini.IniId === '2')).toBe(true);
  });

  it('should exclude self from related initiatives in the map', () => {
    const map = buildRelatedInitiativesMap(initiatives);

    initiatives.forEach((ini) => {
      const related = map.get(ini.IniId);
      expect(related!.every((r) => r.IniId !== ini.IniId)).toBe(true);
    });
  });

  it('should respect the default limit', () => {
    const manyInitiatives: Initiative[] = [
      createMockInitiative('1', 'Main Topic', 'Type'),
      createMockInitiative('2', 'Topic A', 'Type'),
      createMockInitiative('3', 'Topic B', 'Type'),
      createMockInitiative('4', 'Topic C', 'Type'),
      createMockInitiative('5', 'Topic D', 'Type'),
    ];
    const map = buildRelatedInitiativesMap(manyInitiatives);

    const related = map.get('1');
    expect(related!.length).toBeLessThanOrEqual(DEFAULT_RELATED_INITIATIVES_LIMIT);
  });

  it('should respect a custom limit', () => {
    const manyInitiatives: Initiative[] = [
      createMockInitiative('1', 'Main Topic', 'Type'),
      createMockInitiative('2', 'Topic A', 'Type'),
      createMockInitiative('3', 'Topic B', 'Type'),
      createMockInitiative('4', 'Topic C', 'Type'),
      createMockInitiative('5', 'Topic D', 'Type'),
    ];
    const map = buildRelatedInitiativesMap(manyInitiatives, 2);

    const related = map.get('1');
    expect(related!.length).toBeLessThanOrEqual(2);
  });

  it('should return empty map for empty initiatives list', () => {
    const map = buildRelatedInitiativesMap([]);

    expect(map.size).toBe(0);
  });

  it('should handle single initiative (no relations possible)', () => {
    const singleInitiative: Initiative[] = [
      createMockInitiative('1', 'Lonely Initiative', 'Type'),
    ];
    const map = buildRelatedInitiativesMap(singleInitiative);

    expect(map.size).toBe(1);
    expect(map.get('1')).toEqual([]);
  });

  it('should compute consistent results (map values match getRelatedInitiatives)', () => {
    const map = buildRelatedInitiativesMap(initiatives);

    initiatives.forEach((ini) => {
      const fromMap = map.get(ini.IniId);
      const fromFunction = getRelatedInitiatives(ini, initiatives);
      expect(fromMap).toEqual(fromFunction);
    });
  });
});

describe('DEFAULT_RELATED_INITIATIVES_LIMIT', () => {
  it('should be 3', () => {
    expect(DEFAULT_RELATED_INITIATIVES_LIMIT).toBe(3);
  });
});
