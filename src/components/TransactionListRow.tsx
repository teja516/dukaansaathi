import Link from 'next/link';
import type { ReactNode } from 'react';
import { AmountDisplay } from '@/components/AmountDisplay';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  amountPaise: number;
  direction?: 'in' | 'out' | 'neutral';
  badge?: ReactNode;
  href?: string;
}

export function TransactionListRow({ title, subtitle, amountPaise, direction = 'neutral', badge, href }: Props) {
  const inner = (
    <div className={cn('flex items-center justify-between gap-3 px-4 py-3', href && 'hover:bg-accent/40')}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <AmountDisplay paise={amountPaise} tone={direction === 'in' ? 'positive' : direction === 'out' ? 'negative' : 'neutral'} />
        {badge}
      </div>
    </div>
  );
  return href ? <Link href={href} prefetch={false} className="block">{inner}</Link> : inner;
}
