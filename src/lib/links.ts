/** Screen that opens the record behind a schedule row, alert or activity item. */
export function sourceHref(type: string, id: string | null | undefined): string | null {
  if (!id) return type === 'forecast' ? '/cash-forecast' : null;
  switch (type) {
    case 'credit_transaction':
      return `/credit-sales/${id}`;
    case 'supplier_bill':
      return `/supplier-bills/${id}`;
    case 'expense':
    case 'expense_record':
      return `/expenses/${id}`;
    case 'forecast':
      return '/cash-forecast';
    default:
      return null;
  }
}

/** The one direct action offered for an alert, chosen by what the alert is about. */
export function directAction(a: {
  sourceRecordType: string;
  sourceRecordId?: string | null;
  customerId?: string | null;
  alertType?: string;
}): { label: string; href: string } | null {
  if (a.sourceRecordType === 'credit_transaction' && a.customerId) {
    return { label: 'Write a reminder', href: `/payment-reminder-draft?customer_id=${a.customerId}` };
  }
  if (a.sourceRecordType === 'supplier_bill' && a.sourceRecordId) {
    return { label: 'Pay this bill', href: `/supplier-payments/new?supplier_bill_id=${a.sourceRecordId}` };
  }
  if (a.sourceRecordType === 'expense' && a.sourceRecordId) {
    return { label: 'Open expense', href: `/expenses/${a.sourceRecordId}` };
  }
  if (a.alertType === 'projected_cash_shortage') return { label: 'Open Cash Survival Radar', href: '/cash-survival-radar' };
  if (a.sourceRecordType === 'forecast') return { label: 'Open Cash Forecast', href: '/cash-forecast' };
  return null;
}
