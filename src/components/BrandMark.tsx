import { cn } from '@/lib/utils';

/**
 * DukaanSaathi mark: a shop awning over a rising cash line. Drawn as SVG so it stays sharp at any size
 * and matches src/app/icon.svg (the browser tab icon).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="DukaanSaathi" className={cn('h-8 w-8 shrink-0', className)}>
      <rect width="64" height="64" rx="14" fill="hsl(226 52% 30%)" />
      <path d="M12 16h40l4 11a6 6 0 0 1-12 0 6 6 0 0 1-12 0 6 6 0 0 1-12 0 6 6 0 0 1-12 0z" fill="#fff" />
      <path d="M14 48l11-9 8 6 17-16" fill="none" stroke="#f5b942" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="29" r="4" fill="#f5b942" />
    </svg>
  );
}
