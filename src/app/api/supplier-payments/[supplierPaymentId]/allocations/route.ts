import { json, scoped } from '@/lib/http';
import { listSupplierPaymentAllocationRecords } from '@/modules/supplier-payments';

export const GET = scoped(async (_req, s, p) =>
  json({ allocations: await listSupplierPaymentAllocationRecords(s.shopId, p.supplierPaymentId) }),
);
