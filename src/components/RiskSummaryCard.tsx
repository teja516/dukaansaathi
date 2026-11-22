'use client';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AmountDisplay } from '@/components/AmountDisplay';
import { useLanguage } from '@/hooks/useLanguage';
import { cn, formatDate } from '@/lib/utils';

interface Props {
  riskState: string;
  lowestBalancePaise: number;
  lowestBalanceDate: string | null;
  shortfallPaise?: number;
  thresholdPaise?: number;
  href?: string;
}

export function RiskSummaryCard({ riskState, lowestBalancePaise, lowestBalanceDate, shortfallPaise = 0, thresholdPaise, href }: Props) {
  const { t } = useLanguage();
  const shortage = riskState === 'shortage';
  const watch = riskState === 'watch';
  const Icon = shortage ? AlertTriangle : watch ? Eye : CheckCircle2;
  const heading = shortage ? t('Possible cash shortage') : watch ? t('Keep an eye on cash') : t('No cash shortage expected');
  const body = (
    <Card className={cn('flex items-start gap-3 p-4', shortage && 'border-destructive/40 bg-destructive/5', watch && 'border-warning/40 bg-warning/5')}>
      <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', shortage ? 'text-destructive' : watch ? 'text-warning' : 'text-success')} aria-hidden />
      <div className="min-w-0">
        <p className="font-heading font-semibold">{heading}</p>
        <p className="text-sm text-muted-foreground">
          {t('Lowest expected balance')}: <AmountDisplay paise={lowestBalancePaise} size="sm" tone={shortage ? 'negative' : 'neutral'} />
          {lowestBalanceDate ? ` ${t('on {date}', { date: formatDate(lowestBalanceDate) })}` : ''}
        </p>
        {shortage && shortfallPaise > 0 && (
          <p className="text-sm text-destructive">
            {t('Short by')} <AmountDisplay paise={shortfallPaise} size="sm" tone="negative" />
            {thresholdPaise ? ` ${t('against your safety amount')}` : ''}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{t('This is an estimate from the dates you entered, not a guarantee.')}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href} className="block rounded-lg">{body}</Link> : body;
}
