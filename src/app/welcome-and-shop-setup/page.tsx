'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthMe, getShopById } from '@/lib/api';
import { finishOnboarding } from '@/flows/onboarding';
import { errorMessage, formatPaise, rupeesToPaise } from '@/lib/utils';
import { useLanguage, setStoredLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { MoneyInput } from '@/components/MoneyInput';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Step = 1 | 2 | 3;

function Setup() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [cash, setCash] = useState('');
  const [bank, setBank] = useState('');
  const [sample, setSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Resume an unfinished setup instead of creating a second shop.
  useEffect(() => {
    getAuthMe()
      .then(async (me) => {
        if (!me.shop) return;
        setShopId(me.shop.id);
        const shop = await getShopById(me.shop.id);
        setShopName(shop.shopName);
        setOwnerName(shop.ownerName ?? '');
        setCash(String(shop.openingCashBalancePaise / 100));
        setBank(String(shop.openingBankBalancePaise / 100));
      })
      .catch(() => undefined);
  }, []);

  const cashPaise = cash === '' ? 0 : rupeesToPaise(cash);
  const bankPaise = bank === '' ? 0 : rupeesToPaise(bank);
  const step1Ok = shopName.trim().length > 0;
  const step2Ok = cashPaise !== null && bankPaise !== null;

  async function confirm() {
    if (busy || cashPaise === null || bankPaise === null) return;
    setBusy(true);
    setError(null);
    try {
      await finishOnboarding(shopId, {
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || undefined,
        openingCashBalancePaise: cashPaise,
        openingBankBalancePaise: bankPaise,
        interfaceLanguage: language,
        loadSampleData: sample,
      });
      setStoredLanguage(language);
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Set up your shop')} description={t('Step {n} of 3', { n: step })} actions={<LanguageToggle />} />
      <Card className="p-5">
        {error && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <FormField label={t('Shop name')} htmlFor="shopName" required>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} autoFocus />
            </FormField>
            <FormField label={t('Owner name (optional)')} htmlFor="ownerName">
              <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </FormField>
            <Button disabled={!step1Ok} onClick={() => setStep(2)}>{t('Next')}</Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <FormField label={t('Cash in hand today')} htmlFor="cash" helper={t('Count the money in your drawer right now.')} error={cashPaise === null ? t('Enter a valid amount') : null}>
              <MoneyInput id="cash" value={cash} onValueChange={setCash} placeholder="0" />
            </FormField>
            <FormField label={t('Bank / UPI balance (optional)')} htmlFor="bank" helper={t('Leave empty if you do not track it.')} error={bankPaise === null ? t('Enter a valid amount') : null}>
              <MoneyInput id="bank" value={bank} onValueChange={setBank} placeholder="0" />
            </FormField>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>{t('Back')}</Button>
              <Button className="flex-1" disabled={!step2Ok} onClick={() => setStep(3)}>{t('Next')}</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t('Please check these details. You can change them later in Settings.')}</p>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t('Shop name')}</dt><dd className="font-medium">{shopName}</dd>
              {ownerName && (<><dt className="text-muted-foreground">{t('Owner name')}</dt><dd className="font-medium">{ownerName}</dd></>)}
              <dt className="text-muted-foreground">{t('Cash in hand')}</dt><dd className="font-medium">{formatPaise(cashPaise ?? 0)}</dd>
              <dt className="text-muted-foreground">{t('Bank / UPI')}</dt><dd className="font-medium">{formatPaise(bankPaise ?? 0)}</dd>
              <dt className="text-muted-foreground">{t('Language')}</dt><dd className="font-medium">{language === 'hindi' ? 'हिन्दी' : 'English'}</dd>
            </dl>
            {!shopId && (
              <div className="flex items-start gap-3 rounded-md bg-accent/50 p-3">
                <Checkbox id="sample" checked={sample} onCheckedChange={(v) => setSample(v === true)} className="mt-0.5" />
                <Label htmlFor="sample" className="font-normal leading-snug">
                  {t('Add sample customers, bills and expenses so I can look around first.')}
                </Label>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={busy}>{t('Back')}</Button>
              <Button className="flex-1" onClick={confirm} disabled={busy}>{busy ? t('Please wait…') : t('Confirm and start')}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <AppShell allowIncompleteSetup>
      <Setup />
    </AppShell>
  );
}
