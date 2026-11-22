'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, ReceiptText, HandCoins, Truck, Wallet, Banknote } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const ACTIONS = [
  { href: '/credit-sales/new', label: 'Add credit', icon: ReceiptText },
  { href: '/customer-payments/new', label: 'Record payment', icon: HandCoins },
  { href: '/supplier-bills/new', label: 'Add supplier bill', icon: Truck },
  { href: '/supplier-payments/new', label: 'Pay supplier', icon: Banknote },
  { href: '/expenses/new', label: 'Add expense', icon: Wallet },
] as const;

/** Floating "+" button available on every screen for the five daily actions. */
export function QuickAddSheet() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6"
        aria-label={t('Quick add')}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Quick add')}</DialogTitle>
            <DialogDescription>{t('What do you want to record?')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {ACTIONS.map(({ href, label, icon: Icon }) => (
              <Button key={href} asChild variant="outline" className="h-14 justify-start gap-3 text-base" onClick={() => setOpen(false)}>
                <Link href={href}>
                  <Icon className="h-5 w-5" aria-hidden /> {t(label)}
                </Link>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
