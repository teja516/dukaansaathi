import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cashMovements, shops, customerPayments, customers, supplierPayments, suppliers, expens } from '@/db/schema';
import { HttpError } from '@/lib/authContext';

/** Available cash = opening balances + actual inflows - actual outflows. */
export async function computeAvailableCash(shopId: string) {
  const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
  if (!shop) throw new HttpError(404, 'Shop not found');
  const moves = await db
    .select({ d: cashMovements.direction, m: cashMovements.paymentMethod, a: cashMovements.amountPaise })
    .from(cashMovements)
    .where(eq(cashMovements.shopId, shopId));
  let cashNet = 0;
  let bankNet = 0;
  for (const mv of moves) {
    const signed = mv.d === 'inflow' ? mv.a : -mv.a;
    if (mv.m === 'cash') cashNet += signed;
    else bankNet += signed;
  }
  const cashInHand = shop.openingCashBalancePaise + cashNet;
  const bankUpi = shop.openingBankBalancePaise + bankNet;
  return {
    shop,
    available_paise: cashInHand + bankUpi,
    cash_in_hand_paise: cashInHand,
    bank_upi_paise: bankUpi,
    opening_cash_paise: shop.openingCashBalancePaise,
    opening_bank_upi_paise: shop.openingBankBalancePaise,
  };
}

type MovementRow = typeof cashMovements.$inferSelect;

/** Who paid or was paid for each movement, and the screen of the source record (tapped from activity lists). */
export async function describeMovementParties(rows: MovementRow[]): Promise<Map<string, { party: string; href: string | null }>> {
  const out = new Map<string, { party: string; href: string | null }>();
  const cpIds = rows.map((r) => r.customerPaymentId).filter((v): v is string => !!v);
  const spIds = rows.map((r) => r.supplierPaymentId).filter((v): v is string => !!v);
  const exIds = rows.map((r) => r.expenseId).filter((v): v is string => !!v);
  const [cp, sp, ex] = await Promise.all([
    cpIds.length
      ? db.select({ id: customerPayments.id, name: customers.name, customerId: customerPayments.customerId }).from(customerPayments).innerJoin(customers, eq(customers.id, customerPayments.customerId)).where(inArray(customerPayments.id, cpIds))
      : [],
    spIds.length
      ? db.select({ id: supplierPayments.id, name: suppliers.name, billId: supplierPayments.supplierBillId }).from(supplierPayments).innerJoin(suppliers, eq(suppliers.id, supplierPayments.supplierId)).where(inArray(supplierPayments.id, spIds))
      : [],
    exIds.length ? db.select({ id: expens.id, d: expens.description, c: expens.category }).from(expens).where(inArray(expens.id, exIds)) : [],
  ]);
  const cpInfo = new Map(cp.map((r) => [r.id, { party: r.name, href: `/customers/${r.customerId}` }]));
  const spInfo = new Map(sp.map((r) => [r.id, { party: r.name, href: `/supplier-bills/${r.billId}` }]));
  const exInfo = new Map(ex.map((r) => [r.id, { party: r.d || r.c, href: `/expenses/${r.id}` }]));
  for (const r of rows) {
    const info =
      (r.customerPaymentId && cpInfo.get(r.customerPaymentId)) ||
      (r.supplierPaymentId && spInfo.get(r.supplierPaymentId)) ||
      (r.expenseId && exInfo.get(r.expenseId)) ||
      null;
    if (info) out.set(r.id, info);
  }
  return out;
}

export async function getAvailableCashSnapshot(shopId: string, limit = 10) {
  const { shop: _shop, ...totals } = await computeAvailableCash(shopId);
  const recent = await db
    .select()
    .from(cashMovements)
    .where(and(eq(cashMovements.shopId, shopId)))
    .orderBy(desc(cashMovements.movementDate), desc(cashMovements.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
  const parties = await describeMovementParties(recent);
  return {
    ...totals,
    recent_movements: recent.map((m) => {
      const source = m.customerPaymentId
        ? { source_type: 'customer_payment', source_id: m.customerPaymentId }
        : m.supplierPaymentId
          ? { source_type: 'supplier_payment', source_id: m.supplierPaymentId }
          : m.expenseId
            ? { source_type: 'expense', source_id: m.expenseId }
            : { source_type: 'other', source_id: m.id };
      return {
        id: m.id,
        direction: m.direction,
        amount_paise: m.amountPaise,
        payment_method: m.paymentMethod,
        movement_date: m.movementDate,
        party: parties.get(m.id)?.party ?? null,
        href: parties.get(m.id)?.href ?? null,
        reversal: !!m.sourceId?.startsWith('reversal:'),
        ...source,
      };
    }),
    calculated_at: new Date().toISOString(),
  };
}
