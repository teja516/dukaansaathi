'use client';
import Link from 'next/link';
import { ArrowRight, BellRing, CalendarClock, Check, LineChart, ReceiptText, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';

const FEATURES = [
  { icon: ReceiptText, title: 'Udhaar, made simple', text: 'Write down who owes you, how much and by when. A part-payment updates the balance for you.' },
  { icon: Truck, title: 'Supplier bills', text: 'See what you owe each wholesaler and which bill is due first, so no due date is missed.' },
  { icon: Wallet, title: 'Expenses', text: 'Rent, electricity, wages. Money already paid is kept apart from money still to be paid.' },
  { icon: LineChart, title: 'Cash forecast', text: 'See your cash for the next 30, 60 and 90 days, and the day it will be at its lowest.' },
  { icon: CalendarClock, title: 'What if a customer pays late?', text: 'Try a 15-day delay and see which bills would become hard to pay.' },
  { icon: BellRing, title: 'What to do today', text: 'A short list of what needs attention, with polite reminder messages in Hindi or English.' },
] as const;

const STEPS = [
  { title: 'Add your udhaar and bills', text: 'Customers, supplier bills and expenses, with the dates they are due.' },
  { title: 'Record money as it moves', text: 'Payments received and paid. Balances update by themselves.' },
  { title: 'See what is coming', text: 'Know your cash ahead of time and what to do about it today.' },
] as const;

const HONEST = [
  'Forecasts are estimates from the dates you enter. They are never promised.',
  'Money that is already late is left out of the forecast until you set a new date.',
  'Nothing is ever sent to your customers automatically.',
  'Every number comes from plain arithmetic on your own records.',
] as const;

/** A small, clearly-labelled sample of the dashboard (made-up numbers). */
function Preview() {
  const { t } = useLanguage();
  return (
    <Card className="w-full max-w-md overflow-hidden shadow-lg lg:max-w-none">
      <div className="bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-90">{t('Available Cash')}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">₹28,500</p>
        <p className="mt-1 text-xs opacity-80">{t('Cash in hand')}: ₹23,500 · {t('Bank / UPI')}: ₹5,000</p>
      </div>
      <div className="space-y-4 p-5">
        <svg viewBox="0 0 300 90" className="h-auto w-full" role="img" aria-label={t('Sample cash forecast curve')}>
          <line x1="0" x2="300" y1="78" y2="78" stroke="hsl(var(--border))" strokeDasharray="4 4" />
          <path d="M4 14 H60 L70 40 H110 L120 52 H170 L180 34 H215 L225 58 H296" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="225" cy="58" r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
          <text x="225" y="76" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--foreground))">₹3,900</text>
        </svg>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2">
            <span>{t('Bill from ABC Distributors is due soon')}</span>
            <span className="shrink-0 font-semibold tabular-nums">₹12,000</span>
          </li>
          <li className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2">
            <span>{t("Suresh's expected payment has not arrived")}</span>
            <span className="shrink-0 font-semibold tabular-nums">₹1,200</span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">{t('Sample figures, made up for illustration.')}</p>
      </div>
    </Card>
  );
}

export function Landing() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold text-primary" aria-label="DukaanSaathi">
            <BrandMark />
            <span className="hidden min-[380px]:inline">DukaanSaathi</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex" aria-label={t('Main')}>
            <a href="#features" className="inline-flex min-h-10 items-center hover:text-primary">{t('Features')}</a>
            <a href="#how" className="inline-flex min-h-10 items-center hover:text-primary">{t('How it works')}</a>
            <a href="#honest" className="inline-flex min-h-10 items-center hover:text-primary">{t('Honest numbers')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">{t('Sign in')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">{t('Get started')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground sm:text-sm">
              {t('For kirana and neighbourhood shops')}
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {t("Know your shop's cash before it runs short.")}
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t('Keep udhaar, supplier bills and expenses in one simple place. See how much cash you will have in 30, 60 and 90 days, and what to do today.')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">
                  {t('Get started')} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href="#how">{t('See how it works')}</a>
              </Button>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
              {['Works in English and Hindi', 'Made for the phone', 'No accounting knowledge needed'].map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-success" aria-hidden /> {t(s)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Preview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-t bg-card/50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t('Everything a small shop needs to see its cash')}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t('Not a billing machine or a tax tool. A clear view of money in, money out and what is coming next.')}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="p-5">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-heading text-base font-semibold">{t(title)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(text)}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t('How it works')}</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading font-semibold text-primary-foreground">{i + 1}</span>
                  <div>
                    <h3 className="font-heading text-base font-semibold">{t(s.title)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t(s.text)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Honest numbers */}
        <section id="honest" className="scroll-mt-16 border-t bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t('Honest numbers')}</h2>
              <p className="mt-2 text-muted-foreground">{t('A ledger tells you what happened. DukaanSaathi also shows what may happen next, and is clear about what it knows and what it is guessing.')}</p>
            </div>
            <ul className="space-y-3">
              {HONEST.map((h) => (
                <li key={h} className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>{t(h)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground sm:px-10">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">{t("Ready to see your shop's cash clearly?")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm opacity-90 sm:text-base">{t('Set up in a few minutes. Start with your opening cash and add your first udhaar.')}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link href="/signup">{t('Create your account')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto">
                <Link href="/login">{t('Sign in')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-heading font-semibold text-foreground">
            <BrandMark className="h-6 w-6" /> DukaanSaathi
          </div>
          <p className="max-w-xl text-xs sm:text-right">
            {t('Estimates only, not financial advice. Sample figures on this page are made up.')}
          </p>
        </div>
      </footer>
    </div>
  );
}
