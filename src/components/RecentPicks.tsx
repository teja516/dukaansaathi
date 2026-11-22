'use client';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Props {
  /** Recently used ids (most recent first) and the full list to look names up in. */
  recentIds: string[];
  options: { id: string; name: string }[];
  value: string;
  onPick: (id: string) => void;
}

/** One-tap shortcuts for the people the owner uses most (recognition over recall). */
export function RecentPicks({ recentIds, options, value, onPick }: Props) {
  const { t } = useLanguage();
  const items = recentIds.map((id) => options.find((o) => o.id === id)).filter((o): o is { id: string; name: string } => !!o);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t('Recent')}>
      <span className="text-xs text-muted-foreground">{t('Recent')}:</span>
      {items.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          aria-pressed={value === o.id}
          className={cn('rounded-full border px-3 py-1 text-xs', value === o.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}
