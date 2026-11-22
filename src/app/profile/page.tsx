'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getAuthMe, updateAuthMe, createAuthChangePassword } from '@/lib/api';
import { clearToken } from '@/lib/authToken';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Profile() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAuthMe().then((me) => {
      setName(me.user.name);
      setEmail(me.user.email);
    }).catch(() => undefined);
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setProfileError(null);
    setSaved(false);
    try {
      await updateAuthMe({ name: name.trim(), email: email.trim() });
      setSaved(true);
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (busy || next !== confirm) return;
    setBusy(true);
    setPwError(null);
    try {
      await createAuthChangePassword({ current_password: current, new_password: next });
      // The server signs every session out after a password change.
      clearToken();
      router.replace('/login');
    } catch (err) {
      setPwError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={t('Profile')} />
      <Card>
        <CardHeader><CardTitle>{t('Your details')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="flex flex-col gap-4" noValidate>
            {profileError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{profileError}</p>}
            {saved && <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{t('Saved.')}</p>}
            <FormField label={t('Your name')} htmlFor="name" required><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></FormField>
            <FormField label={t('Email')} htmlFor="email" required><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
            <Button type="submit" disabled={busy || !name.trim() || !email.trim()}>{t('Save')}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('Change password')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="flex flex-col gap-4" noValidate>
            {pwError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{pwError}</p>}
            <FormField label={t('Current password')} htmlFor="current" required><Input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></FormField>
            <FormField label={t('New password')} htmlFor="next" helper={t('At least 8 characters.')} required><Input id="next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></FormField>
            <FormField label={t('Confirm new password')} htmlFor="confirm" error={confirm && confirm !== next ? t('Passwords do not match') : null} required><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></FormField>
            <p className="text-xs text-muted-foreground">{t('You will be signed out and asked to sign in again.')}</p>
            <Button type="submit" disabled={busy || !current || next.length < 8 || next !== confirm}>{t('Change password')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}
