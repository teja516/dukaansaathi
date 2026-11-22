import { describe, expect, it } from 'vitest';
import { allocateInOrder } from '@/lib/allocation';
import { changedFields } from '@/lib/changes';
import { addDays, daysBetween, formatPaise, rupeesToPaise, todayIST } from '@/lib/utils';
import { translate } from '@/lib/i18n';
import { hindi } from '@/lib/i18n.hi';

describe('FIFO allocation (spec 21.1, 21.2)', () => {
  const items = [
    { id: 'old', remainingAmountPaise: 100_000 },
    { id: 'mid', remainingAmountPaise: 50_000 },
    { id: 'new', remainingAmountPaise: 200_000 },
  ];
  it('settles the oldest first', () => {
    expect(allocateInOrder(items, 60_000)).toEqual([{ id: 'old', amountPaise: 60_000 }]);
  });
  it('spills over into the next item', () => {
    expect(allocateInOrder(items, 130_000)).toEqual([
      { id: 'old', amountPaise: 100_000 },
      { id: 'mid', amountPaise: 30_000 },
    ]);
  });
  it('pays everything exactly when the amount equals the total owed', () => {
    const out = allocateInOrder(items, 350_000);
    expect(out.reduce((s, a) => s + a.amountPaise, 0)).toBe(350_000);
    expect(out).toHaveLength(3);
  });
  it('never allocates more than the total owed (excess is left unallocated, callers reject it earlier)', () => {
    expect(allocateInOrder(items, 999_999).reduce((s, a) => s + a.amountPaise, 0)).toBe(350_000);
  });
  it('skips items with nothing left and handles zero', () => {
    expect(allocateInOrder([{ id: 'a', remainingAmountPaise: 0 }, { id: 'b', remainingAmountPaise: 5 }], 5)).toEqual([{ id: 'b', amountPaise: 5 }]);
    expect(allocateInOrder(items, 0)).toEqual([]);
  });
});

describe('money formatting and parsing', () => {
  it('groups rupees the Indian way', () => {
    expect(formatPaise(240_000)).toBe('₹2,400');
    expect(formatPaise(12_345_600)).toBe('₹1,23,456');
    expect(formatPaise(10_000_000_00)).toBe('₹1,00,00,000');
    expect(formatPaise(0)).toBe('₹0');
    expect(formatPaise(null)).toBe('₹0');
  });
  it('shows paise only when present and keeps the sign', () => {
    expect(formatPaise(12_550)).toBe('₹125.50');
    expect(formatPaise(-620_000)).toBe('-₹6,200');
  });
  it('parses rupee text into integer paise without floating-point drift', () => {
    expect(rupeesToPaise('2,400')).toBe(240_000);
    expect(rupeesToPaise('₹19.99')).toBe(1_999);
    expect(rupeesToPaise('0.07')).toBe(7);
    expect(rupeesToPaise('1.005')).toBeNull();
    expect(rupeesToPaise('abc')).toBeNull();
    expect(rupeesToPaise('-5')).toBeNull();
  });
});

describe('dates (IST calendar days)', () => {
  it('adds and subtracts days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('counts whole days between dates', () => {
    expect(daysBetween('2026-11-16', '2026-11-21')).toBe(5);
    expect(daysBetween('2026-11-21', '2026-11-16')).toBe(-5);
  });
  it('uses the IST date, not UTC, for "today"', () => {
    // 20:00 UTC on 21 Nov is already 01:30 on 22 Nov in India.
    expect(todayIST(new Date('2026-11-21T20:00:00Z'))).toBe('2026-11-22');
    expect(todayIST(new Date('2026-11-21T18:29:00Z'))).toBe('2026-11-21');
  });
});

describe('audit change set', () => {
  it('records only the fields that changed, with old and new values', () => {
    const r = changedFields({ amountPaise: 100, description: 'a', dueDate: '2026-01-01' }, { amountPaise: 100, description: 'b', dueDate: undefined });
    expect(r).toEqual({ before: { description: 'a' }, after: { description: 'b' }, changed: true });
  });
  it('reports no change when nothing differs', () => {
    expect(changedFields({ a: 1 }, { a: 1 }).changed).toBe(false);
  });
});

describe('translations', () => {
  it('fills placeholders and falls back to English for unknown text', () => {
    expect(translate('english', 'Due {date}', { date: '5 Dec' })).toBe('Due 5 Dec');
    expect(translate('hindi', 'No such string anywhere')).toBe('No such string anywhere');
    expect(translate('hindi', '{n} days', { n: 30 })).toBe('30 दिन');
  });
  it('translates templated server messages', () => {
    expect(translate('hindi', 'Sale date must be a valid date')).toContain('सही तारीख');
  });
  it('every Hindi entry keeps exactly the same {placeholders} as its English key', () => {
    const names = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    const bad = Object.entries(hindi).filter(([en, hi]) => names(en) !== names(hi)).map(([en]) => en);
    expect(bad).toEqual([]);
  });
  it('has no empty translations', () => {
    expect(Object.entries(hindi).filter(([, hi]) => !hi.trim())).toEqual([]);
  });
});
