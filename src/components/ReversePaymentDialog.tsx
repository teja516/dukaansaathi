'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/FormField';
import { useLanguage } from '@/hooks/useLanguage';
import { errorMessage, formatPaise } from '@/lib/utils';

interface Props {
  /** The payment being reversed; null = closed. */
  payment: { id: string; amountPaise: number; date: string } | null;
  kind: 'customer' | 'supplier';
  onClose: () => void;
  /** Must throw on failure; resolve on success. */
  onReverse: (paymentId: string, reason: string) => Promise<unknown>;
}

/** A mistaken payment is reversed, not deleted: the owner gives a reason and the history keeps both entries. */
export function ReversePaymentDialog({ payment, kind, onClose, onReverse }: Props) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReason('');
    setError(null);
    setBusy(false);
  }, [payment?.id]);

  async function submit() {
    if (!payment || busy || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onReverse(payment.id, reason.trim());
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!payment} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Reverse this payment?')}</DialogTitle>
          <DialogDescription>
            {payment &&
              (kind === 'customer'
                ? t('The {amount} payment will be undone. The customer will owe it again and your cash will go down by the same amount.', { amount: formatPaise(payment.amountPaise) })
                : t('The {amount} payment will be undone. The bill will be owed again and your cash will go up by the same amount.', { amount: formatPaise(payment.amountPaise) }))}
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{t('The original entry is kept in the history and marked as reversed. Nothing is deleted.')}</p>
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <FormField label={t('Why are you reversing it?')} htmlFor="reverse-reason" required>
          <Textarea id="reverse-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        </FormField>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('Cancel')}</Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !reason.trim()}>{busy ? t('Please wait…') : t('Reverse payment')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
