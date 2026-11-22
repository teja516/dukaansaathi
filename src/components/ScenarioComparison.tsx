'use client';
import { Card } from '@/components/ui/card';
import { AmountDisplay } from '@/components/AmountDisplay';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate } from '@/lib/utils';

interface Side {
  lowest_balance_paise: number;
  lowest_balance_date: string;
}

interface Props {
  original: Side;
  scenario: Side;
  differencePaise: number;
  newShortage: boolean;
}

export function ScenarioComparison({ original, scenario, differencePaise, newShortage }: Props) {
  const { t } = useLanguage();
  const col = (title: string, side: Side) => (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <AmountDisplay paise={side.lowest_balance_paise} size="lg" tone={side.lowest_balance_paise < 0 ? 'negative' : 'neutral'} />
      <p className="text-xs text-muted-foreground">{t('Lowest balance on {date}', { date: formatDate(side.lowest_balance_date) })}</p>
    </Card>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {col(t('Actual forecast'), original)}
      {col(t('If payment is late'), scenario)}
      <Card className={newShortage ? 'border-destructive/40 bg-destructive/5 p-4' : 'p-4'}>
        <p className="text-sm text-muted-foreground">{t('Difference')}</p>
        <AmountDisplay paise={differencePaise} size="lg" tone={differencePaise < 0 ? 'negative' : 'neutral'} />
        <p className="text-xs text-muted-foreground">{newShortage ? t('This would cause a new cash shortage.') : t('No new shortage.')}</p>
      </Card>
    </div>
  );
}
