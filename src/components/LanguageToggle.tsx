'use client';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const base = 'min-h-9 px-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm';
  return (
    <div className={cn('inline-flex overflow-hidden rounded-md border border-input bg-card', className)} role="group" aria-label="Language">
      <button type="button" className={cn(base, language === 'english' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} aria-pressed={language === 'english'} onClick={() => setLanguage('english')}>
        English
      </button>
      <button type="button" className={cn(base, language === 'hindi' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} aria-pressed={language === 'hindi'} onClick={() => setLanguage('hindi')}>
        हिन्दी
      </button>
    </div>
  );
}
