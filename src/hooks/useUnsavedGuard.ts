'use client';
import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Warns before leaving a form with unsaved entries: closing the tab / reloading (browser prompt)
 * and tapping an in-app link (confirm box). Programmatic navigation after a successful save is not blocked.
 */
export function useUnsavedGuard(dirty: boolean): void {
  const { t } = useLanguage();
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank') return;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      if (!window.confirm(t('You have not saved this entry. Leave without saving?'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty, t]);
}
