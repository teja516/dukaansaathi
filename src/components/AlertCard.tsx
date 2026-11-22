'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AmountDisplay } from '@/components/AmountDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { useLanguage } from '@/hooks/useLanguage';
import { directAction } from '@/lib/links';
import { formatDate } from '@/lib/utils';

export interface AlertData {
  id: string;
  alertType: string;
  filterCategory: string;
  status: string;
  priorityRank: number;
  amountPaise?: number | null;
  dueDate?: string | null;
  sourceRecordType: string;
  sourceRecordId?: string | null;
  customerId?: string | null;
  actionNote?: string | null;
  title?: string;
  why_it_matters?: string;
  recommended_action?: string;
  hi?: { title: string; why_it_matters: string; recommended_action: string };
}

function sourceHref(a: AlertData): string | null {
  if (a.sourceRecordType === 'credit_transaction' && a.customerId) return `/customers/${a.customerId}`;
  if (a.sourceRecordType === 'supplier_bill' && a.sourceRecordId) return `/supplier-bills/${a.sourceRecordId}`;
  if (a.sourceRecordType === 'expense' && a.sourceRecordId) return `/expenses/${a.sourceRecordId}`;
  if (a.sourceRecordType === 'forecast') return '/cash-forecast';
  return null;
}

interface Props {
  alert: AlertData;
  busy?: boolean;
  onReview: (id: string) => void;
  onTakeAction: (id: string, note: string) => void;
}

export function AlertCard({ alert, busy, onReview, onTakeAction }: Props) {
  const { t, language } = useLanguage();
  const text = language === 'hindi' && alert.hi ? alert.hi : alert;
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');
  const href = sourceHref(alert);
  const action = directAction(alert);
  const closed = alert.status === 'resolved' || alert.status === 'action_taken';
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading font-semibold">{text.title ?? alert.alertType.replace(/_/g, ' ')}</p>
          {text.why_it_matters && <p className="mt-0.5 text-sm text-muted-foreground">{text.why_it_matters}</p>}
        </div>
        <StatusBadge status={alert.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {alert.amountPaise != null && <AmountDisplay paise={alert.amountPaise} />}
        {alert.dueDate && <span className="text-muted-foreground">{formatDate(alert.dueDate)}</span>}
      </div>
      {text.recommended_action && <p className="mt-2 rounded-md bg-accent/50 px-3 py-2 text-sm">{text.recommended_action}</p>}
      {alert.actionNote && <p className="mt-2 text-sm text-muted-foreground">{t('Note')}: {alert.actionNote}</p>}
      {noting && (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('What did you do? (optional)')} maxLength={300} />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => onTakeAction(alert.id, note)}>{t('Save')}</Button>
            <Button size="sm" variant="outline" onClick={() => setNoting(false)}>{t('Cancel')}</Button>
          </div>
        </div>
      )}
      {!closed && !noting && (
        <div className="mt-3 flex flex-wrap gap-2">
          {action && (
            <Button asChild size="sm">
              <Link href={action.href}>{t(action.label)}</Link>
            </Button>
          )}
          {href && (
            <Button asChild size="sm" variant="outline">
              <Link href={href}>{t('Open record')}</Link>
            </Button>
          )}
          {alert.status === 'new' && (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onReview(alert.id)}>{t('Mark reviewed')}</Button>
          )}
          <Button size="sm" disabled={busy} onClick={() => setNoting(true)}>{t('I took action')}</Button>
        </div>
      )}
    </Card>
  );
}
