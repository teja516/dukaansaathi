'use client';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { translate, type Language } from '@/lib/i18n';

const KEY = 'dukaan_language';
const listeners = new Set<() => void>();

function read(): Language {
  if (typeof window === 'undefined') return 'english';
  try {
    return window.localStorage.getItem(KEY) === 'hindi' ? 'hindi' : 'english';
  } catch {
    return 'english';
  }
}

function hasStoredPreference(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function setStoredLanguage(language: Language): void {
  try {
    window.localStorage.setItem(KEY, language);
  } catch {
    /* storage unavailable: language lasts for this page only */
  }
  document.documentElement.lang = language === 'hindi' ? 'hi' : 'en';
  listeners.forEach((l) => l());
}

/** Adopt the shop's saved language only when the user has not chosen one on this device. */
export function adoptLanguageIfUnset(language: Language): void {
  if (!hasStoredPreference()) setStoredLanguage(language);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

/** Language is shared app-wide; switching never reloads or clears a form. */
export function useLanguage() {
  const language = useSyncExternalStore(subscribe, read, () => 'english' as Language);
  // Screen readers and the browser's font choice follow the page language.
  useEffect(() => {
    document.documentElement.lang = language === 'hindi' ? 'hi' : 'en';
  }, [language]);
  const t = useCallback((text: string, vars?: Record<string, string | number>) => translate(language, text, vars), [language]);
  return { language, setLanguage: setStoredLanguage, t };
}
