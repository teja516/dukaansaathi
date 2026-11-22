'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createAuthLogin } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // The session lives in an HttpOnly cookie set by the server; nothing is kept in browser storage.
      const res = await createAuthLogin({ email, password });
      router.replace(res.shop_id ? '/' : '/welcome-and-shop-setup');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t('Sign in')} description={t('Welcome back. Sign in to see your shop.')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <FormField label={t('Email')} htmlFor="email" required>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>
        <FormField label={t('Password')} htmlFor="password" required>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormField>
        <Button type="submit" disabled={busy || !email || !password}>{busy ? t('Signing in…') : t('Sign in')}</Button>
        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="inline-flex min-h-10 items-center text-primary hover:underline">{t('Forgot password?')}</Link>
          <Link href="/signup" className="inline-flex min-h-10 items-center text-primary hover:underline">{t('Create an account')}</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
