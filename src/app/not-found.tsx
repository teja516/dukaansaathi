'use client';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

/** Shown for any address that does not exist. */
export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-10 text-center">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <BrandMark className="h-14 w-14" />
      <div>
        <p className="font-heading text-5xl font-bold text-primary">404</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold">{t('Page not found')}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {t('We could not find the page you were looking for. It may have moved, or the link may be wrong.')}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/">{t('Go to home')}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">{t('Sign in')}</Link>
        </Button>
      </div>
    </div>
  );
}
