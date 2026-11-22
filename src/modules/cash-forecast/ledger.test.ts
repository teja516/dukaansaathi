import { describe, expect, it } from 'vitest';
import { addDaysTo, buildLedger, type LedgerInput } from './ledger';

const TODAY = '2026-11-21';
const d = (n: number) => addDaysTo(TODAY, n);

function input(over: Partial<LedgerInput> = {}): LedgerInput {
  return { today: TODAY, periodDays: 30, startingCashPaise: 1_000_000, credits: [], bills: [], expenses: [], ...over };
}

describe('forecast ledger (spec 6.9, 9.4, 12.3)', () => {
  it('starts from actual cash and is flat when nothing is scheduled', () => {
    const r = buildLedger(input());
    expect(r.days).toHaveLength(31);
    expect(r.days.every((x) => x.closing_balance_paise === 1_000_000)).toBe(true);
    expect(r.lowestBalancePaise).toBe(1_000_000);
    expect(r.lowestBalanceDate).toBe(TODAY);
  });

  it('adds an expected collection on its expected date only', () => {
    const r = buildLedger(input({ credits: [{ id: 'c1', label: 'Ravi', remainingPaise: 240_000, expectedDate: d(10) }] }));
    expect(r.days[9].closing_balance_paise).toBe(1_000_000);
    expect(r.days[10].closing_balance_paise).toBe(1_240_000);
    expect(r.events[0]).toMatchObject({ kind: 'expected_collection', date: d(10), amount_paise: 240_000 });
  });

  it('subtracts a supplier bill and an expense on their due dates', () => {
    const r = buildLedger(
      input({
        bills: [{ id: 'b1', label: 'ABC', remainingPaise: 300_000, dueDate: d(3) }],
        expenses: [{ id: 'e1', label: 'rent', amountPaise: 200_000, dueDate: d(9) }],
      }),
    );
    expect(r.days[3].closing_balance_paise).toBe(700_000);
    expect(r.days[9].closing_balance_paise).toBe(500_000);
    expect(r.scheduledOutflowsPaise).toBe(500_000);
    expect(r.lowestBalancePaise).toBe(500_000);
    expect(r.lowestBalanceDate).toBe(d(9));
  });

  it('carries each closing balance into the next day (inflow then outflow)', () => {
    const r = buildLedger(
      input({
        credits: [{ id: 'c', label: 'A', remainingPaise: 100_000, expectedDate: d(2) }],
        bills: [{ id: 'b', label: 'S', remainingPaise: 400_000, dueDate: d(5) }],
      }),
    );
    expect(r.days.map((x) => x.closing_balance_paise).slice(0, 7)).toEqual([1_000_000, 1_000_000, 1_100_000, 1_100_000, 1_100_000, 700_000, 700_000]);
  });

  describe('period boundaries', () => {
    const credits = [
      { id: 'on30', label: 'A', remainingPaise: 111, expectedDate: d(30) },
      { id: 'on31', label: 'B', remainingPaise: 222, expectedDate: d(31) },
    ];
    it('30 days includes day 30 and excludes day 31', () => {
      const r = buildLedger(input({ periodDays: 30, credits }));
      expect(r.events.map((e) => e.source_id)).toEqual(['on30']);
    });
    it('60 days includes both', () => {
      const r = buildLedger(input({ periodDays: 60, credits }));
      expect(r.events.map((e) => e.source_id).sort()).toEqual(['on30', 'on31']);
    });
  });

  describe('uncertain collections (spec 21.3, 21.5)', () => {
    it('excludes an overdue collection and lists it with the reason', () => {
      const r = buildLedger(input({ credits: [{ id: 'c', label: 'Suresh', remainingPaise: 120_000, expectedDate: d(-5) }] }));
      expect(r.events).toHaveLength(0);
      expect(r.overdueExcludedPaise).toBe(120_000);
      expect(r.excluded).toEqual([{ customer_name: 'Suresh', amount_paise: 120_000, expected_payment_date: d(-5), reason: 'overdue', source_id: 'c' }]);
      expect(r.endingBalancePaise).toBe(1_000_000);
    });
    it('excludes a credit with no expected date and lists it', () => {
      const r = buildLedger(input({ credits: [{ id: 'c', label: 'X', remainingPaise: 50_000, expectedDate: null }] }));
      expect(r.events).toHaveLength(0);
      expect(r.undatedPaise).toBe(50_000);
      expect(r.excluded[0].reason).toBe('no_date');
    });
    it('a collection expected today is included, not overdue', () => {
      const r = buildLedger(input({ credits: [{ id: 'c', label: 'X', remainingPaise: 10_000, expectedDate: TODAY }] }));
      expect(r.events).toHaveLength(1);
      expect(r.excluded).toHaveLength(0);
    });
    it('a revised expected date brings an overdue credit back in', () => {
      const r = buildLedger(input({ credits: [{ id: 'c', label: 'Suresh', remainingPaise: 120_000, expectedDate: d(3) }] }));
      expect(r.events).toHaveLength(1);
      expect(r.excluded).toHaveLength(0);
    });
  });

  describe('already-owed obligations', () => {
    it('counts an overdue bill today and flags it', () => {
      const r = buildLedger(input({ bills: [{ id: 'b', label: 'S', remainingPaise: 100_000, dueDate: d(-4) }] }));
      expect(r.events[0]).toMatchObject({ date: TODAY, overdue: true, original_date: d(-4) });
      expect(r.days[0].closing_balance_paise).toBe(900_000);
      expect(r.overdueObligationsPaise).toBe(100_000);
    });
    it('counts an overdue expense today and flags it', () => {
      const r = buildLedger(input({ expenses: [{ id: 'e', label: 'rent', amountPaise: 80_000, dueDate: d(-1) }] }));
      expect(r.events[0]).toMatchObject({ date: TODAY, overdue: true });
    });
    it('ignores an expense with no due date (nothing to schedule)', () => {
      const r = buildLedger(input({ expenses: [{ id: 'e', label: 'x', amountPaise: 80_000, dueDate: null }] }));
      expect(r.events).toHaveLength(0);
    });
  });

  describe('no double counting (spec 9.5)', () => {
    it('ignores fully paid items (nothing remaining)', () => {
      const r = buildLedger(
        input({
          credits: [{ id: 'c', label: 'A', remainingPaise: 0, expectedDate: d(5) }],
          bills: [{ id: 'b', label: 'S', remainingPaise: 0, dueDate: d(5) }],
        }),
      );
      expect(r.events).toHaveLength(0);
    });
    it('counts only the remaining part of a partly paid credit', () => {
      const r = buildLedger(input({ credits: [{ id: 'c', label: 'Ravi', remainingPaise: 140_000, expectedDate: d(10) }] }));
      expect(r.expectedInflowsPaise).toBe(140_000);
    });
  });

  describe('what-if delay (spec 6.11)', () => {
    const base = input({
      startingCashPaise: 2_850_000,
      credits: [
        { id: 'ravi', label: 'Ravi', remainingPaise: 240_000, expectedDate: d(10) },
        { id: 'lakshmi', label: 'Lakshmi', remainingPaise: 80_000, expectedDate: d(5) },
      ],
      bills: [{ id: 'abc', label: 'ABC', remainingPaise: 1_200_000, dueDate: d(3) }],
      expenses: [{ id: 'rent', label: 'rent', amountPaise: 800_000, dueDate: d(9) }],
    });

    it('moves only the selected collection', () => {
      const r = buildLedger({ ...base, delay: { creditId: 'ravi', days: 15 } });
      expect(r.events.find((e) => e.source_id === 'ravi')?.date).toBe(d(25));
      expect(r.events.find((e) => e.source_id === 'lakshmi')?.date).toBe(d(5));
    });
    it('never worsens beyond the delayed amount and does not mutate the input', () => {
      const snapshot = JSON.stringify(base);
      const original = buildLedger(base);
      const late = buildLedger({ ...base, delay: { creditId: 'ravi', days: 15 } });
      expect(JSON.stringify(base)).toBe(snapshot);
      expect(late.lowestBalancePaise).toBeLessThanOrEqual(original.lowestBalancePaise);
      expect(original.lowestBalancePaise - late.lowestBalancePaise).toBeLessThanOrEqual(240_000);
      expect(late.endingBalancePaise).toBe(original.endingBalancePaise);
    });
    it('a delay that pushes the payment past the period removes it from the window', () => {
      const r = buildLedger({ ...base, periodDays: 30, delay: { creditId: 'ravi', days: 40 } });
      expect(r.events.some((e) => e.source_id === 'ravi')).toBe(false);
    });
    it('applies the delay to the stored expected date (the what-if service rejects overdue credits before this)', () => {
      const withOverdue = input({ credits: [{ id: 'o', label: 'X', remainingPaise: 100, expectedDate: d(-3) }] });
      expect(buildLedger(withOverdue).excluded[0].reason).toBe('overdue');
      expect(buildLedger({ ...withOverdue, delay: { creditId: 'o', days: 15 } }).events[0].date).toBe(d(12));
    });
  });

  it('reports the FIRST day the lowest balance is reached', () => {
    const r = buildLedger(
      input({
        bills: [{ id: 'b', label: 'S', remainingPaise: 400_000, dueDate: d(4) }],
        credits: [{ id: 'c', label: 'A', remainingPaise: 100_000, expectedDate: d(8) }],
      }),
    );
    expect(r.lowestBalancePaise).toBe(600_000);
    expect(r.lowestBalanceDate).toBe(d(4));
  });

  it('shows a negative balance when obligations exceed cash (shortage)', () => {
    const r = buildLedger(input({ startingCashPaise: 100_000, bills: [{ id: 'b', label: 'S', remainingPaise: 250_000, dueDate: d(2) }] }));
    expect(r.lowestBalancePaise).toBe(-150_000);
    expect(r.lowestBalanceDate).toBe(d(2));
  });

  it('sorts same-day events by amount, largest first', () => {
    const r = buildLedger(
      input({
        bills: [
          { id: 'small', label: 'A', remainingPaise: 1, dueDate: d(1) },
          { id: 'big', label: 'B', remainingPaise: 9, dueDate: d(1) },
        ],
      }),
    );
    expect(r.events.map((e) => e.source_id)).toEqual(['big', 'small']);
  });
});
