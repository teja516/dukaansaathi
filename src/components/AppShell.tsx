'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Bell, Gauge, LayoutDashboard, LineChart, LogOut, Settings, Truck, UserCircle, Users, Wallet } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { getAuthMe, createAuthLogout, ApiError } from '@/lib/api';
import { clearToken } from '@/lib/authToken';
import { cn } from '@/lib/utils';
import { useLanguage, adoptLanguageIfUnset } from '@/hooks/useLanguage';
import { LanguageToggle } from '@/components/LanguageToggle';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/cash-forecast', label: 'Cash Forecast', icon: LineChart },
  { href: '/action-centre', label: 'Action Centre', icon: Bell },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

type Me = Awaited<ReturnType<typeof getAuthMe>>;

// Pages mount a fresh AppShell on every navigation. Remember who is signed in for a short time so that
// moving between pages does not repeat the request. Only a COMPLETE setup is cached, so finishing the
// welcome wizard is never answered with a stale "not finished".
let meCache: { at: number; promise: Promise<Me>; value: Me | null } | null = null;
const ME_TTL_MS = 30_000;

function loadMe(): Promise<Me> {
  if (meCache && Date.now() - meCache.at < ME_TTL_MS) return meCache.promise;
  const promise = getAuthMe();
  const entry = { at: Date.now(), promise, value: null as Me | null };
  meCache = entry;
  promise
    .then((value) => {
      if (value.shop?.setup_completed_at) entry.value = value;
      else if (meCache === entry) meCache = null;
    })
    .catch(() => {
      if (meCache === entry) meCache = null;
    });
  return promise;
}

export function clearMeCache(): void {
  meCache = null;
}

function cachedMe(): Me | null {
  return meCache && Date.now() - meCache.at < ME_TTL_MS ? meCache.value : null;
}

interface Props {
  children: ReactNode;
  /** The setup screen itself must be reachable before setup is done. */
  allowIncompleteSetup?: boolean;
}

export function AppShell({ children, allowIncompleteSetup = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [me, setMe] = useState<Me | null>(cachedMe);

  useEffect(() => {
    let cancelled = false;
    loadMe()
      .then((result) => {
        if (cancelled) return;
        if (!allowIncompleteSetup && (!result.shop || !result.shop.setup_completed_at)) {
          router.replace('/welcome-and-shop-setup');
          return;
        }
        if (result.shop) adoptLanguageIfUnset(result.shop.interface_language === 'hindi' ? 'hindi' : 'english');
        setMe(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearMeCache();
          clearToken();
          router.replace('/login');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router, allowIncompleteSetup]);

  async function signOut() {
    try {
      await createAuthLogout({});
    } finally {
      clearMeCache();
      clearToken();
      router.replace('/login');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-card px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold text-primary">
          <BrandMark className="h-7 w-7" /> <span className="hidden min-[380px]:inline">DukaanSaathi</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('Account menu')}>
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{me?.user.name ?? ''}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/profile"><UserCircle className="h-4 w-4" /> {t('Profile')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="h-4 w-4" /> {t('Settings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/activity-log"><Gauge className="h-4 w-4" /> {t('Activity log')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/expenses"><Wallet className="h-4 w-4" /> {t('Expenses')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/available-cash"><Gauge className="h-4 w-4" /> {t('Available Cash')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut}>
                <LogOut className="h-4 w-4" /> {t('Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-48 shrink-0 flex-col gap-1 border-r p-3 md:flex lg:w-56" aria-label={t('Main')}>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent',
                isActive(pathname, href) && 'bg-accent text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden /> {t(label)}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden" aria-label={t('Main')}>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? 'page' : undefined}
            className={cn('flex flex-col items-center gap-0.5 py-2 text-[10px]', isActive(pathname, href) ? 'text-primary' : 'text-muted-foreground')}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="max-w-full truncate px-1">{t(label)}</span>
          </Link>
        ))}
      </nav>
      <QuickAddSheet />
    </div>
  );
}
