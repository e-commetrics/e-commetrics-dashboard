import { describe, it, expect } from 'bun:test';
import { compare, RATES } from '../lib/cost';

describe('compare', () => {
  it('prices one engineer for three months', () => {
    const r = compare(1, 3);
    expect(r.ours.min).toBe(15600);
    expect(r.ours.max).toBe(15600);
    expect(r.inhouse).toEqual({ min: 36000, max: 54000 });
  });
  it('scales to five engineers for a year', () => {
    const r = compare(5, 12);
    expect(r.agency.max).toBe(2_400_000);
    expect(r.agency.min).toBe(1_440_000);
    expect(r.ours.min).toBe(312_000);
  });
  it('clamps out-of-range input to 1–5 engineers and 3–12 months', () => {
    expect(compare(0, 1)).toEqual(compare(1, 3));
    expect(compare(9, 99)).toEqual(compare(5, 12));
    expect(compare(Number.NaN, Number.NaN)).toEqual(compare(1, 3));
  });
  it('reports savings versus an in-house hire', () => {
    expect(compare(1, 1).savingsVsInhouse.min).toBe((RATES.inhouseMin - RATES.ours) * 3);
    expect(compare(2, 6).savingsVsInhouse.max).toBe((RATES.inhouseMax - RATES.ours) * 12);
  });
});
