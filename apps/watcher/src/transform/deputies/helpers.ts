/**
 * Pure helper functions for deputy transformation.
 * Extracted from transform.ts for easier unit testing.
 */

import type { ParliamentDeputado } from './types.js';

const romanNumerals: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
  XIII: 13,
  XIV: 14,
  XV: 15,
  XVI: 16,
  XVII: 17,
  XVIII: 18,
  XIX: 19,
  XX: 20,
};

export function parseLegislature(legDes: string): number {
  return romanNumerals[legDes] || 17;
}

export function getPhotoUrl(depId: number): string {
  return `https://app.parlamento.pt/webutils/getimage.aspx?id=${depId}&type=deputado`;
}

export function isActiveDeputy(dep: ParliamentDeputado): boolean {
  return dep.DepSituacao.some((sit) => {
    return sit.sioDes.toLowerCase().includes('efetivo');
  });
}

export function getCurrentParty(dep: ParliamentDeputado): string | null {
  const now = new Date();
  const currentGP = dep.DepGP.find((gp) => {
    const endDate = gp.gpDtFim ? new Date(gp.gpDtFim) : null;
    return !endDate || endDate > now;
  });
  return currentGP?.gpSigla || dep.DepGP[0]?.gpSigla || null;
}

export function getMandateDates(dep: ParliamentDeputado): { start: string | null; end: string | null } {
  let start: string | null = null;
  let end: string | null = null;

  for (const sit of dep.DepSituacao) {
    if (!start || sit.sioDtInicio < start) {
      start = sit.sioDtInicio;
    }
    if (sit.sioDtFim) {
      if (!end || sit.sioDtFim > end) {
        end = sit.sioDtFim;
      }
    }
  }

  return { start, end };
}

/**
 * Deduplicates deputies by DepId, keeping the most recent record.
 */
export function deduplicateDeputies(
  deputados: ParliamentDeputado[]
): Map<number, ParliamentDeputado> {
  const uniqueDeputies = new Map<number, ParliamentDeputado>();

  for (const dep of deputados) {
    const existing = uniqueDeputies.get(dep.DepId);
    if (!existing) {
      uniqueDeputies.set(dep.DepId, dep);
    } else {
      const existingDates = getMandateDates(existing);
      const newDates = getMandateDates(dep);
      if (newDates.start && (!existingDates.start || newDates.start > existingDates.start)) {
        uniqueDeputies.set(dep.DepId, dep);
      }
    }
  }

  return uniqueDeputies;
}
