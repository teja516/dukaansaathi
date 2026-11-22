'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { getAuthMe, getShopById, updateShop } from '@/lib/api';
import { errorMessage, formatPaise, rupeesToPaise } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { MoneyInput } from '@/components/MoneyInput';
import { LanguageToggle } from '@/components/LanguageToggle';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Settings() {
  const { t, language } = useLanguage();
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [threshold, setThreshold] = useState('');
  const [openingCash, setOpeningCash] = useState(0);
  const [openingBank, setOpeningBank] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAuthMe()
      .then(async (me) => {
        if (!me.shop) return;
        setShopId(me.shop.id);
        const s = await getShopById(me.shop.id);
        setShopName(s.shopName);
        setOwnerName(s.ownerName ?? '');
        setThreshold(String(s.cashSafetyThresholdPaise / 100));
        setOpeningCash(s.openingCashBalancePaise);
        setOpeningBank(s.openingBankBalancePaise);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const thresholdPaise = threshold === '' ? 0 : rupeesToPaise(threshold);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || !shopId || thresholdPaise === null) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateShop(shopId, { shopName: shopName.trim(), ownerName: ownerName.trim() || null, cashSafetyThresholdPaise: thresholdPaise, interfaceLanguage: language });
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={t('Settings')} />
      <Card>
        <CardHeader><CardTitle>{t('Language')}</CardTitle></CardHeader>
        <CardContent>
          <LanguageToggle />
          <p className="mt-2 text-xs text-muted-foreground">{t('Your amounts, dates and records stay exactly the same. Names you typed are not translated.')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('Activity log')}</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">{t('A record of what was added, changed or reversed, and by whom.')}</p>
          <Button asChild variant="outline"><Link href="/activity-log">{t('Open activity log')}</Link></Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('Shop')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-4" noValidate>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {saved && <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{t('Saved.')}</p>}
            <FormField label={t('Shop name')} htmlFor="shopName" required><Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} /></FormField>
            <FormField label={t('Owner name (optional)')} htmlFor="ownerName"><Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></FormField>
            <FormField
              label={t('Cash safety amount')}
              htmlFor="threshold"
              helper={t('You are warned when your expected cash falls below this. The default is ₹0, which means a warning only if cash would go below zero.')}
              error={thresholdPaise === null ? t('Enter a valid amount') : null}
            >
              <MoneyInput id="threshold" value={threshold} onValueChange={setThreshold} placeholder="0" />
            </FormField>
            <dl className="grid grid-cols-2 gap-y-1 rounded-md bg-muted px-3 py-2 text-sm">
              <dt className="text-muted-foreground">{t('Opening cash')}</dt><dd>{formatPaise(openingCash)}</dd>
              <dt className="text-muted-foreground">{t('Opening bank / UPI')}</dt><dd>{formatPaise(openingBank)}</dd>
            </dl>
            <Button type="submit" disabled={busy || !shopName.trim() || thresholdPaise === null || !shopId}>{busy ? t('Saving…') : t('Save settings')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <Settings />
    </AppShell>
  );
}
