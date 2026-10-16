/**
 * Lightweight access to the learner's saved chemistry practical simulations, without
 * pulling the simulation models into a bundle (used for the catalog progress badges).
 */

export const CHEM_PRACTICAL_STORAGE_KEY = 'elementa-chem-practicals:v1';

/** Number of recorded readings per practical slug. Safe on the server (returns {}). */
export function readChemPracticalProgress(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CHEM_PRACTICAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { sessions?: Record<string, { rows?: unknown[] }> };
    const out: Record<string, number> = {};
    for (const [slug, session] of Object.entries(parsed.sessions ?? {})) out[slug] = Array.isArray(session?.rows) ? session.rows.length : 0;
    return out;
  } catch {
    return {};
  }
}
