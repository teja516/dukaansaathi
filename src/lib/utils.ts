import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translate } from '@/lib/i18n';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format integer paise as Indian-grouped rupees, e.g. 240000 -> "₹2,400". */
export function formatPaise(paise: number | null | undefined, opts: { decimals?: boolean } = {}): string {
  const value = (paise ?? 0) / 100;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const fixed = opts.decimals || !Number.isInteger(abs) ? abs.toFixed(2) : String(abs);
  const [int, frac] = fixed.split('.');
  let grouped = int;
  if (int.length > 3) {
    const last3 = int.slice(-3);
    const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = `${rest},${last3}`;
  }
  return `${sign}₹${grouped}${frac ? `.${frac}` : ''}`;
}

/** Parse a rupee string ("2,400.50") to integer paise. Returns null when invalid. */
export function rupeesToPaise(input: string | number): number | null {
  const s = String(input).replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

/** Today's date in India Standard Time as YYYY-MM-DD. */
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  const d = new Date(toUtc(date) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

function currentLanguage(): 'english' | 'hindi' {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('dukaan_language') === 'hindi' ? 'hindi' : 'english';
  } catch {
    return 'english';
  }
}

/** Extract a human message from an ApiError (body is usually `{"error":"..."}`), in the chosen language. */
export function errorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  let message = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') message = parsed.error;
  } catch {
    /* not JSON */
  }
  return translate(currentLanguage(), message || 'Something went wrong');
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
