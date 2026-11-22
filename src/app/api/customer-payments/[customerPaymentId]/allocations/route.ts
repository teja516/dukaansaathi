import { json, scoped } from '@/lib/http';
import { listCustomerPaymentAllocationRecords } from '@/modules/customer-payments';

export const GET = scoped(async (_req, s, p) =>
  json({ allocations: await listCustomerPaymentAllocationRecords(s.shopId, p.customerPaymentId) }),
);
