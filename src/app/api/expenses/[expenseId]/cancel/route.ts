import { json, scoped } from '@/lib/http';
import { cancelExpense } from '@/modules/expenses';

export const POST = scoped(async (_req, s, p) => json({ expense: await cancelExpense(s, p.expenseId) }));
