'use client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

export interface ReviewRow {
  label: string;
  value: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  rows: ReviewRow[];
  /** Plain-language sentence under the table, e.g. "₹1,000 will be received; ₹1,400 will remain." */
  note?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
}

/** "Check before you save" step: nothing financial is saved until the owner confirms this summary. */
export function ReviewDialog({ open, onOpenChange, title, rows, note, confirmLabel, busy, onConfirm }: Props) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t('Check before saving')}</DialogTitle>
          <DialogDescription>{t('Please check these details. Nothing is saved until you confirm.')}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="break-words text-right font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
        {note && <p className="rounded-md bg-accent/50 px-3 py-2 text-sm">{note}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('Go back and edit')}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? t('Saving…') : (confirmLabel ?? t('Confirm and save'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
