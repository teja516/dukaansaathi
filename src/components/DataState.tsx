'use client';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface Props {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}

/** Shared loading / error wrapper so every screen handles both the same way. */
export function DataState({ loading, error, onRetry, children }: Props) {
  const { t } = useLanguage();
  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm">
        <p className="font-medium text-destructive">{t('We could not load this.')}</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            {t('Try again')}
          </Button>
        )}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={t('Loading')}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  return <>{children}</>;
}
