'use client';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { AmountDisplay } from '@/components/AmountDisplay';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { sourceHref } from '@/lib/links';
import { cn, formatDate } from '@/lib/utils';

export interface ScheduleItem {
  date: string;
  kind: string;
  label: string;
  amount_paise: number;
  source_type: string;
  source_id: string;
  overdue?: boolean;
  original_date?: string;
}

const CATEGORY_LABELS = ['rent', 'electricity', 'wages', 'transport', 'other'];

export function ScheduleList({ items, empty }: { items: ScheduleItem[]; empty?: string }) {
  const { t } = useLanguage();
  if (items.length === 0) return <p className="px-4 py-6 text-sm text-muted-foreground">{empty ?? t('Nothing scheduled.')}</p>;
  return (
    <ul className="divide-y">
      {items.map((it) => {
        const incoming = it.kind === 'expected_collection';
        const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
        const href = sourceHref(it.source_type, it.source_id);
        const body = (
          <>
            <Icon className={incoming ? 'h-4 w-4 shrink-0 text-success' : 'h-4 w-4 shrink-0 text-destructive'} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {CATEGORY_LABELS.includes(it.label) ? t(it.label.charAt(0).toUpperCase() + it.label.slice(1)) : it.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {it.overdue && it.original_date
                  ? t('Was due {date}, counted today', { date: formatDate(it.original_date) })
                  : formatDate(it.date)}{' '}
                · {incoming ? t('Expected from customer') : it.kind === 'supplier_bill_due' ? t('Supplier bill due') : t('Expense due')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <AmountDisplay paise={it.amount_paise} tone={incoming ? 'positive' : 'negative'} />
              {it.overdue && <Badge variant="destructive">{t('Overdue')}</Badge>}
            </div>
          </>
        );
        const key = `${it.source_type}-${it.source_id}-${it.date}`;
        return (
          <li key={key}>
            {href ? (
              <Link href={href} prefetch={false} className={cn('flex items-center gap-3 px-4 py-3 hover:bg-accent/40')}>
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
