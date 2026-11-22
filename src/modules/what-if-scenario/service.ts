import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creditTransactions, customers } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { addDays, todayIST } from '@/lib/utils';
import { computeForecast } from '@/modules/cash-forecast';
import { computeAvailableCash } from '@/modules/available-cash';

/**
 * "What if this customer pays N days late?" (default 15). Recomputes the forecast with ONE
 * collection moved later, in memory only. No record is read-write; nothing is saved.
 */
export async function runWhatIfScenario(
  shopId: string,
  query: { credit_transaction_id?: string; delay_days?: number },
) {
  if (!query.credit_transaction_id) throw new HttpError(400, 'Choose a credit sale to delay');
  const delay = query.delay_days ?? 15;
  if (!Number.isInteger(delay) || delay < 1 || delay > 90) throw new HttpError(400, 'Delay must be between 1 and 90 days');

  const [row] = await db
    .select({ tx: creditTransactions, customerName: customers.name })
    .from(creditTransactions)
    .innerJoin(customers, eq(customers.id, creditTransactions.customerId))
    .where(and(eq(creditTransactions.shopId, shopId), eq(creditTransactions.id, query.credit_transaction_id)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Credit sale not found');
  if (row.tx.remainingAmountPaise <= 0) throw new HttpError(400, 'This credit sale is already fully paid');

  if (!row.tx.expectedPaymentDate) {
    throw new HttpError(400, 'This credit has no expected payment date, so the forecast does not count it. Add a date first.');
  }
  if (row.tx.expectedPaymentDate < todayIST()) {
    throw new HttpError(400, 'This payment is already overdue and is not counted in the forecast, so delaying it changes nothing.');
  }

  const period = 90;
  const [original, scenario] = await Promise.all([
    computeForecast(shopId, period),
    computeForecast(shopId, period, { delayCreditTransactionId: row.tx.id, delayDays: delay }),
  ]);

  const { shop } = await computeAvailableCash(shopId);
  const limit = Math.max(shop.cashSafetyThresholdPaise, 0);
  const newShortage = scenario.lowest_balance_paise < limit && original.lowest_balance_paise >= limit;
  const worsened = scenario.lowest_balance_paise < original.lowest_balance_paise;

  // Day-by-day view: every payment and bill from today to the low point (or to the moved payment,
  // whichever is later), with the balance at the end of that day in both versions.
  const delayedDate = addDays(row.tx.expectedPaymentDate, delay);
  const windowEnd = scenario.lowest_balance_date > delayedDate ? scenario.lowest_balance_date : delayedDate;
  const originalClose = new Map(original.days.map((d) => [d.date, d.closing_balance_paise]));
  const scenarioClose = new Map(scenario.days.map((d) => [d.date, d.closing_balance_paise]));
  const timeline = scenario.events
    .filter((e) => e.date <= windowEnd)
    .map((e) => {
      const isMoved = e.source_id === row.tx.id;
      const balanceOriginal = originalClose.get(e.date) ?? 0;
      const balanceScenario = scenarioClose.get(e.date) ?? 0;
      const risk = balanceScenario < limit ? 'short' : balanceScenario < balanceOriginal ? 'tighter' : 'same';
      return {
        date: e.date,
        kind: e.kind,
        label: e.label,
        amount_paise: e.amount_paise,
        source_type: e.source_type,
        source_id: e.source_id,
        moved: isMoved,
        original_date: isMoved ? row.tx.expectedPaymentDate : null,
        balance_original_paise: balanceOriginal,
        balance_scenario_paise: balanceScenario,
        risk,
      };
    });
  const suggested = newShortage
    ? 'This delay would cause a cash shortage. Follow up with this customer early and review the bills and expenses due before it.'
    : worsened
      ? 'The low point gets worse but stays above zero. Keep an eye on the obligations due around that date.'
      : 'This delay does not change your lowest cash point in the next 90 days.';

  const summary = (f: typeof original) => ({
    lowest_balance_paise: f.lowest_balance_paise,
    lowest_balance_date: f.lowest_balance_date,
    days: f.days,
  });
  return {
    credit_transaction_id: row.tx.id,
    customer_name: row.customerName,
    amount_paise: row.tx.remainingAmountPaise,
    original_expected_date: row.tx.expectedPaymentDate,
    delayed_expected_date: row.tx.expectedPaymentDate ? addDays(row.tx.expectedPaymentDate, delay) : null,
    delay_days: delay,
    period_days: period,
    original: summary(original),
    scenario: summary(scenario),
    difference_paise: scenario.lowest_balance_paise - original.lowest_balance_paise,
    new_shortage: newShortage,
    timeline,
    suggested_action: suggested,
    note: 'This is a simulation. Your actual records and forecast were not changed.',
  };
}
