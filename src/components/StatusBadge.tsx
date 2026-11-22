'use client';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';

type Variant = 'success' | 'warning' | 'destructive' | 'secondary' | 'default';

const MAP: Record<string, { label: string; variant: Variant }> = {
  paid: { label: 'Paid', variant: 'success' },
  partially_paid: { label: 'Partly paid', variant: 'warning' },
  partial: { label: 'Partly paid', variant: 'warning' },
  unpaid: { label: 'Unpaid', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'secondary' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  clear: { label: 'Clear', variant: 'success' },
  due_soon: { label: 'Due soon', variant: 'warning' },
  due_today: { label: 'Due today', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  new: { label: 'New', variant: 'default' },
  reviewed: { label: 'Reviewed', variant: 'secondary' },
  action_taken: { label: 'Action taken', variant: 'success' },
  resolved: { label: 'Resolved', variant: 'secondary' },
  normal: { label: 'Normal', variant: 'success' },
  watch: { label: 'Keep an eye', variant: 'warning' },
  shortage: { label: 'Possible shortage', variant: 'destructive' },
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const entry = MAP[status] ?? { label: status.replace(/_/g, ' '), variant: 'secondary' as Variant };
  return <Badge variant={entry.variant}>{t(entry.label)}</Badge>;
}
