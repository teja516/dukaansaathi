import { formatPaise, cn } from '@/lib/utils';

interface Props {
  paise: number | null | undefined;
  /** positive = green, negative = red, neutral = default */
  tone?: 'auto' | 'neutral' | 'positive' | 'negative' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
  className?: string;
}

const sizes = { sm: 'text-sm', md: 'text-base font-semibold', lg: 'text-xl font-semibold sm:text-2xl', xl: 'text-3xl font-bold sm:text-4xl' };

export function AmountDisplay({ paise, tone = 'neutral', size = 'md', showSign = false, className }: Props) {
  const value = paise ?? 0;
  const resolved = tone === 'auto' ? (value < 0 ? 'negative' : 'neutral') : tone;
  const color =
    resolved === 'positive' ? 'text-success' : resolved === 'negative' ? 'text-destructive' : resolved === 'warning' ? 'text-warning' : 'text-foreground';
  const sign = showSign && value > 0 ? '+' : '';
  return <span className={cn('break-words tabular-nums', sizes[size], color, className)}>{sign}{formatPaise(value)}</span>;
}
