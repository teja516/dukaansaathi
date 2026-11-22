import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creditTransactions, supplierBills, cashMovements, customers, suppliers, expens } from '@/db/schema';
import { addDays, todayIST } from '@/lib/utils';
import { computeAvailableCash, describeMovementParties } from '@/modules/available-cash';
import { computeForecast } from '@/modules/cash-forecast';
import { classifyRisk } from '@/modules/cash-survival-radar';
import { computeAlertCandidates } from '@/modules/alerts';

/** Single source for the dashboard figures: the UI never recomputes these totals. */
export async function getDashboardSnapshot(shopId: string) {
  const today = todayIST();
  // Phase 1: today's cash is needed by the forecast and the alerts.
  const cash = await computeAvailableCash(shopId);

  // Phase 2: every other read is independent. Running them together makes the page cost the slowest
  // query instead of the sum of ~20 round trips.
  const [forecast, [custAgg], [supAgg], [sample], [anyCustomer], [anyBill], moves, newCredits, newBills, newExpenses] = await Promise.all([
    computeForecast(shopId, 30, { availablePaise: cash.available_paise }),
    db
      .select({
        outstanding: sql<number>`coalesce(sum(${creditTransactions.remainingAmountPaise}), 0)::int`,
        overdue: sql<number>`coalesce(sum(case when ${creditTransactions.expectedPaymentDate} < ${today} then ${creditTransactions.remainingAmountPaise} else 0 end), 0)::int`,
      })
      .from(creditTransactions)
      .where(and(eq(creditTransactions.shopId, shopId), gt(creditTransactions.remainingAmountPaise, 0))),
    db
      .select({ outstanding: sql<number>`coalesce(sum(${supplierBills.remainingAmountPaise}), 0)::int` })
      .from(supplierBills)
      .where(and(eq(supplierBills.shopId, shopId), gt(supplierBills.remainingAmountPaise, 0))),
    db.select({ id: customers.id }).from(customers).where(and(eq(customers.shopId, shopId), eq(customers.isSample, true))).limit(1),
    db.select({ id: customers.id }).from(customers).where(eq(customers.shopId, shopId)).limit(1),
    db.select({ id: supplierBills.id }).from(supplierBills).where(eq(supplierBills.shopId, shopId)).limit(1),
    db.select().from(cashMovements).where(eq(cashMovements.shopId, shopId)).orderBy(desc(cashMovements.movementDate), desc(cashMovements.createdAt)).limit(8),
    db
      .select({ c: creditTransactions, name: customers.name })
      .from(creditTransactions)
      .innerJoin(customers, eq(customers.id, creditTransactions.customerId))
      .where(eq(creditTransactions.shopId, shopId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(5),
    db
      .select({ b: supplierBills, name: suppliers.name })
      .from(supplierBills)
      .innerJoin(suppliers, eq(suppliers.id, supplierBills.supplierId))
      .where(eq(supplierBills.shopId, shopId))
      .orderBy(desc(supplierBills.createdAt))
      .limit(5),
    db.select().from(expens).where(eq(expens.shopId, shopId)).orderBy(desc(expens.createdAt)).limit(5),
  ]);

  // Phase 3: these need results from phase 2.
  const [candidates, parties] = await Promise.all([
    computeAlertCandidates(shopId, { forecast, cash }),
    describeMovementParties(moves),
  ]);

  const weekEnd = addDays(today, 7);
  const schedule = forecast.events
    .filter((e) => e.date <= weekEnd)
    .map((e) => ({
      date: e.date,
      kind: e.kind,
      label: e.label,
      amount_paise: e.amount_paise,
      source_type: e.source_type,
      source_id: e.source_id,
      ...(e.overdue ? { overdue: true, original_date: e.original_date } : {}),
    }));

  const priority_actions = candidates.slice(0, 5).map((c) => ({
    title: c.title,
    party: c.party,
    amount_paise: c.amountPaise ?? 0,
    due_date: c.dueDate,
    why_it_matters: c.why_it_matters,
    action: c.recommended_action,
    hi: c.hi,
    customer_id: c.customerId,
    alert_type: c.alertType,
    source_type: c.sourceRecordType,
    source_id: c.sourceRecordId,
  }));

  const movementEvents = moves.map((m) => {
    const source_type = m.customerPaymentId ? 'customer_payment' : m.supplierPaymentId ? 'supplier_payment' : m.expenseId ? 'expense' : 'cash_movement';
    const source_id = m.customerPaymentId ?? m.supplierPaymentId ?? m.expenseId ?? m.id;
    const reversal = !!m.sourceId?.startsWith('reversal:');
    return {
      date: m.movementDate,
      sort: m.createdAt.getTime(),
      type: reversal ? 'reversal' : m.direction,
      description: m.direction === 'inflow' ? 'Money received' : 'Money paid',
      party: parties.get(m.id)?.party ?? null,
      href: parties.get(m.id)?.href ?? null,
      amount_paise: m.amountPaise,
      source_type,
      source_id,
    };
  });

  const addedEvents = [
    ...newCredits.map(({ c, name }) => ({ date: c.transactionDate, sort: c.createdAt.getTime(), type: 'credit_added', description: 'Credit added', party: name, href: `/credit-sales/${c.id}`, amount_paise: c.amountPaise, source_type: 'credit_transaction', source_id: c.id })),
    ...newBills.map(({ b, name }) => ({ date: b.billDate, sort: b.createdAt.getTime(), type: 'bill_added', description: 'Supplier bill added', party: name, href: `/supplier-bills/${b.id}`, amount_paise: b.amountPaise, source_type: 'supplier_bill', source_id: b.id })),
    ...newExpenses.map((e) => ({ date: e.expenseDate, sort: e.createdAt.getTime(), type: 'expense_added', description: 'Expense recorded', party: e.description || e.category, href: `/expenses/${e.id}`, amount_paise: e.amountPaise, source_type: 'expense_record', source_id: e.id })),
  ];
  const recent_activity = [...movementEvents, ...addedEvents]
    .sort((x, y) => y.date.localeCompare(x.date) || y.sort - x.sort)
    .slice(0, 8)
    .map(({ sort: _sort, ...rest }) => rest);

  return {
    shop_name: cash.shop.shopName,
    has_sample_data: !!sample,
    has_any_records: !!anyCustomer || !!anyBill || moves.length > 0,
    cash_in_hand_paise: cash.cash_in_hand_paise,
    bank_upi_paise: cash.bank_upi_paise,
    today_ist: today,
    available_cash_paise: cash.available_paise,
    customer_outstanding_paise: custAgg.outstanding,
    overdue_customer_paise: custAgg.overdue,
    supplier_outstanding_paise: supAgg.outstanding,
    next_7_days: {
      incoming_paise: schedule.filter((s) => s.kind === 'expected_collection').reduce((n, s) => n + s.amount_paise, 0),
      outgoing_paise: schedule.filter((s) => s.kind !== 'expected_collection').reduce((n, s) => n + s.amount_paise, 0),
      schedule,
    },
    cash_risk: {
      risk_state: classifyRisk(forecast, cash.shop.cashSafetyThresholdPaise),
      lowest_balance_paise: forecast.lowest_balance_paise,
      lowest_balance_date: forecast.lowest_balance_date,
    },
    priority_actions,
    recent_activity,
    calculated_at: new Date().toISOString(),
  };
}
