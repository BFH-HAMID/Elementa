import { beforeEach, describe, expect, it } from 'vitest';
import { getChemPracticalModel, tasksDone } from '@/engine/chemPracticals';
import { CHEM_PRACTICAL_STORAGE_KEY, readChemPracticalProgress, useChemPracticalStore } from '@/store/chemPracticalStore';

const s = () => useChemPracticalStore.getState();

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

beforeEach(() => {
  const storage = new MemoryStorage();
  (globalThis as unknown as { window: unknown }).window = { localStorage: storage };
  useChemPracticalStore.setState({ slug: null, params: {}, rows: [], sessions: {}, hydrated: false, playing: false, noiseEnabled: false });
});

describe('chemistry practical simulation store', () => {
  it('opens a practical with its default controls', () => {
    s().open('titration-burette');
    expect(s().slug).toBe('titration-burette');
    expect(s().params.trial).toBe(1);
    expect(s().params.vol).toBe(0);
  });

  it('only records valid observations and ticks off the matching task', () => {
    s().open('titration-burette');
    expect(s().record()).toBeNull();
    s().setParam('vol', 25.05);
    const row = s().record();
    expect(row).not.toBeNull();
    expect(row!.values.titre).toBeCloseTo(25.05, 2);
    expect(tasksDone(s().rows.map((r) => r.values)).has(0)).toBe(true);
  });

  it('restarts the process control when a condition changes, but keeps it for view controls', () => {
    s().open('rusting-conditions');
    s().setParam('day', 5);
    s().setParam('tube', 2); // which tube to look at — a view control
    expect(s().params.day).toBe(5);
    s().open('prepare-hydrogen');
    s().setParam('t', 300);
    s().setParam('conc', 2); // a new experimental condition
    expect(s().params.t).toBe(0);
  });

  it('clears the conclusion whenever the observation changes', () => {
    s().open('flame-test');
    s().setParams({ air: 1, clean: 1, ion: 2 });
    expect(s().params.ion).toBe(2);
    s().setParam('sample', 1);
    expect(s().params.ion).toBe(-1);
  });

  it('plays the stopwatch and pauses at the next suggested reading', () => {
    s().open('prepare-hydrogen');
    s().setPlaying(true);
    s().tickPlay(1); // 20 s per second → would pass 30 s? no: 20 s
    expect(s().params.t).toBeCloseTo(20, 6);
    s().tickPlay(1); // 40 s, but the first suggested reading is at 30 s
    expect(s().params.t).toBe(30);
    expect(s().playing).toBe(false);
    s().record();
    s().setPlaying(true);
    s().tickPlay(5);
    expect(s().params.t).toBe(60);
  });

  it('remembers each practical separately and survives a reload', () => {
    s().open('titration-burette');
    s().setParam('vol', 25.05);
    s().record();
    s().open('acid-base-neutralisation');
    s().setParam('vb', 10);
    s().record();
    expect(readChemPracticalProgress()).toMatchObject({ 'titration-burette': 1, 'acid-base-neutralisation': 1 });
    const raw = (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.getItem(CHEM_PRACTICAL_STORAGE_KEY);
    expect(raw).toContain('titration-burette');
    // simulate a fresh page load
    useChemPracticalStore.setState({ slug: null, params: {}, rows: [], sessions: {}, hydrated: false });
    s().open('titration-burette');
    expect(s().rows).toHaveLength(1);
    s().removeRow(s().rows[0].id);
    expect(s().rows).toHaveLength(0);
  });

  it('resets the controls and ignores unknown practicals', () => {
    s().open('heat-of-neutralisation');
    s().setParam('vb', 25);
    s().resetParams();
    expect(s().params.vb).toBe(0);
    s().open('no-such-practical');
    expect(s().slug).toBe('heat-of-neutralisation');
    expect(getChemPracticalModel('no-such-practical')).toBeNull();
  });
});
