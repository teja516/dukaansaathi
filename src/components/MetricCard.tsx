import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { AmountDisplay } from '@/components/AmountDisplay';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  paise?: number;
  value?: string;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
  href?: string;
}

export function MetricCard({ label, paise, value, hint, tone = 'neutral', href }: Props) {
  const body = (
    <Card className={cn('flex h-full flex-col gap-1 p-4', href && 'transition-colors hover:bg-accent/40')}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {paise !== undefined ? <AmountDisplay paise={paise} tone={tone} size="lg" /> : <span className="break-words text-xl font-semibold sm:text-2xl">{value}</span>}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-lg">
      {body}
    </Link>
  ) : (
    body
  );
}
