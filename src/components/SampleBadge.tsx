'use client';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';

/** Marks made-up demo records so nobody mistakes them for real business data. */
export function SampleBadge() {
  const { t } = useLanguage();
  return (
    <Badge variant="outline" className="ml-2 align-middle text-[10px] font-medium uppercase">
      {t('Sample')}
    </Badge>
  );
}
