import { describe, expect, it } from 'vitest';
import { classifyRisk } from './risk';

describe('risk state (spec 6.10, 21.4)', () => {
  const f = (lowest: number, start = 1_000_000) => ({ lowest_balance_paise: lowest, starting_available_paise: start });
  it('is a shortage when the lowest balance is below zero (default threshold 0)', () => {
    expect(classifyRisk(f(-1), 0)).toBe('shortage');
  });
  it('zero exactly is not a shortage with the default threshold', () => {
    expect(classifyRisk(f(0), 0)).not.toBe('shortage');
  });
  it('is a shortage below a configured safety amount', () => {
    expect(classifyRisk(f(400_000), 500_000)).toBe('shortage');
    expect(classifyRisk(f(500_000), 500_000)).not.toBe('shortage');
  });
  it('watches when the low point is under 25% of today\'s cash', () => {
    expect(classifyRisk(f(200_000), 0)).toBe('watch');
    expect(classifyRisk(f(250_000), 0)).toBe('normal');
  });
  it('is normal when nothing drops', () => {
    expect(classifyRisk(f(1_000_000), 0)).toBe('normal');
  });
});
