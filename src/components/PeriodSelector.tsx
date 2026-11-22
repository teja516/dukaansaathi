'use client';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export type Period = '30' | '60' | '90';

export function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { t } = useLanguage();
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-input bg-card" role="group" aria-label={t('Forecast period')}>
      {(['30', '60', '90'] as const).map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={value === p}
          onClick={() => onChange(p)}
          className={cn('px-3.5 py-2 text-sm font-medium', value === p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
        >
          {t('{n} days', { n: p })}
        </button>
      ))}
    </div>
  );
}
