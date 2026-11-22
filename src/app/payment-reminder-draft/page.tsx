'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { getCustomers, getCustomerReminderDraft } from '@/lib/api';
import { errorMessage, formatPaise, formatDate } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { FormField } from '@/components/FormField';
import { NativeSelect } from '@/components/NativeSelect';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Lang = 'english' | 'hindi';

function Draft() {
  const { t, language } = useLanguage();
  const preset = useSearchParams().get('customer_id') ?? '';
  const customers = useAsync(() => getCustomers({ filter: 'outstanding', limit: 200, sort: 'name' }), []);
  const [customerId, setCustomerId] = useState(preset);
  const [lang, setLang] = useState<Lang>(language);
  const [text, setText] = useState('');
  const [meta, setMeta] = useState<{ outstanding: number; asOf: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setText('');
    setMeta(null);
    setError(null);
    if (!customerId) return;
    let cancelled = false;
    getCustomerReminderDraft(customerId, { language: lang })
      .then((d) => {
        if (cancelled) return;
        setText(d.text);
        setMeta({ outstanding: d.outstanding_paise, asOf: d.as_of_ist_date });
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [customerId, lang]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('Could not copy. Select the text and copy it manually.'));
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Reminder message')} description={t('A polite message you can edit and send yourself.')} backHref={preset ? `/customers/${preset}` : '/customers'} backLabel={t('Back')} />
      <DataState loading={customers.loading} error={customers.error} onRetry={customers.reload}>
        <Card className="flex flex-col gap-4 p-5">
          <FormField label={t('Customer')} htmlFor="customer">
            <NativeSelect id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">{t('Choose a customer')}</option>
              {customers.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name} — {formatPaise(c.outstanding_paise)}</option>)}
            </NativeSelect>
          </FormField>
          <div className="inline-flex self-start overflow-hidden rounded-md border" role="group" aria-label={t('Message language')}>
            {(['hindi', 'english'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn('px-3.5 py-2 text-sm font-medium', lang === l ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
                {l === 'hindi' ? 'हिन्दी' : 'English'}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {customerId && meta && (
            <>
              <p className="text-xs text-muted-foreground">{t('Uses the amount still outstanding today ({amount}, as of {date}).', { amount: formatPaise(meta.outstanding), date: formatDate(meta.asOf) })}</p>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[140px]" aria-label={t('Message')} />
              <div className="flex items-center gap-3">
                <Button onClick={copy} disabled={!text}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? t('Copied') : t('Copy message')}</Button>
                <p className="text-xs text-muted-foreground">{t('Nothing is sent automatically. Paste it into WhatsApp or SMS yourself.')}</p>
              </div>
            </>
          )}
        </Card>
      </DataState>
    </div>
  );
}

export default function ReminderDraftPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Draft />
      </Suspense>
    </AppShell>
  );
}
