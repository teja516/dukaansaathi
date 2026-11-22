'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AmountDisplay } from '@/components/AmountDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { SampleBadge } from '@/components/SampleBadge';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate } from '@/lib/utils';

export interface CustomerRowData {
  id: string;
  name: string;
  phone_number: string | null;
  outstanding_paise: number;
  overdue_paise: number;
  oldest_unpaid_date: string | null;
  due_status: 'clear' | 'partial' | 'overdue';
  is_sample?: boolean;
}

export function CustomerRow({ customer }: { customer: CustomerRowData }) {
  const { t } = useLanguage();
  const initials = customer.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (
    <Link href={`/customers/${customer.id}`} prefetch={false} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40">
      <Avatar>
        <AvatarFallback>{initials || '?'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{customer.name}{customer.is_sample && <SampleBadge />}</p>
        <p className="truncate text-xs text-muted-foreground">
          {customer.phone_number ?? t('No phone number')}
          {customer.oldest_unpaid_date ? ` · ${t('Unpaid since {date}', { date: formatDate(customer.oldest_unpaid_date) })}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <AmountDisplay paise={customer.outstanding_paise} tone={customer.overdue_paise > 0 ? 'negative' : 'neutral'} />
        <StatusBadge status={customer.outstanding_paise === 0 ? 'clear' : customer.overdue_paise > 0 ? 'overdue' : 'pending'} />
      </div>
    </Link>
  );
}
