import { describe, expect, it } from 'bun:test';
import { namesMatch, normalizeName } from './attendance-helpers.js';

describe('normalizeName', () => {
  it('lowercases, strips diacritics and punctuation, and trims', () => {
    expect(normalizeName('  José Manuel Carvalho-Silva  ')).toBe('jose manuel carvalhosilva');
    expect(normalizeName('Maria João Pereira d’Almeida')).toBe('maria joao pereira dalmeida');
  });
});

describe('namesMatch', () => {
  it('matches full name vs short name and ignores diacritics', () => {
    // Direct accent-insensitive equality
    expect(namesMatch('José Silva', 'Jose Silva')).toBe(true);
    // Short name (substring) vs full name -> contains-match.
    expect(namesMatch('Maria Pereira', 'Maria João Pereira de Sousa')).toBe(true);
    // Different deputies should NOT match.
    expect(namesMatch('Ana Costa', 'Pedro Marques')).toBe(false);
  });

  it('handles edge inputs (single token, hyphens, empty space)', () => {
    // Single shared token in shorter name (1/1 = 100%) → matches.
    expect(namesMatch('Silva', 'João Silva Costa')).toBe(true);
    // No overlap → no match.
    expect(namesMatch('Silva', 'Pereira')).toBe(false);
    // Hyphenated surnames normalise the same way as joined ones.
    expect(namesMatch('Ana Carvalho-Silva', 'Ana CarvalhoSilva')).toBe(true);
  });
});
