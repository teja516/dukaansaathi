'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { Card } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';

export function AuthLayout({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-8 sm:py-10">
      <div className="flex w-full max-w-md items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-semibold text-primary" aria-label="DukaanSaathi">
          <BrandMark className="h-8 w-8" /> DukaanSaathi
        </Link>
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md p-5 sm:p-6">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-5">{children}</div>
      </Card>
    </div>
  );
}
