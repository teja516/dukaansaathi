'use client';
import { Card } from '@/components/ui/card';
import { AmountDisplay } from '@/components/AmountDisplay';
import { useLanguage } from '@/hooks/useLanguage';
import { formatPaise } from '@/lib/utils';

interface Props {
  beforePaise: number;
  amountPaise: number;
  afterPaise: number;
  /** Customer payments are received; supplier payments are paid. */
  mode: 'receive' | 'pay';
}

/** Plain-language confirmation shown before saving a payment. */
export function PaymentPreviewCard({ beforePaise, amountPaise, afterPaise, mode }: Props) {
  const { t } = useLanguage();
  const sentence =
    mode === 'receive'
      ? t('{amount} will be received; {left} will remain on this credit.', { amount: formatPaise(amountPaise), left: formatPaise(afterPaise) })
      : t('{amount} will be paid; {left} will remain on this bill.', { amount: formatPaise(amountPaise), left: formatPaise(afterPaise) });
  return (
    <Card className="bg-accent/40 p-4" aria-live="polite">
      <p className="mb-3 text-sm font-medium">{sentence}</p>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">{t('Before')}</dt>
          <dd><AmountDisplay paise={beforePaise} /></dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{mode === 'receive' ? t('Received') : t('Paying')}</dt>
          <dd><AmountDisplay paise={amountPaise} tone={mode === 'receive' ? 'positive' : 'negative'} /></dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('Remaining')}</dt>
          <dd><AmountDisplay paise={afterPaise} /></dd>
        </div>
      </dl>
    </Card>
  );
}
