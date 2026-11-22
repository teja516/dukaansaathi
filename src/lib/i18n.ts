import { hindi } from '@/lib/i18n.hi';

export type Language = 'english' | 'hindi';

const PATTERNS: [RegExp, string][] = [
  [/^(.+) must be a valid date$/, '{0} सही तारीख होनी चाहिए'],
  [/^(.+) must be greater than zero$/, '{0} शून्य से ज़्यादा होनी चाहिए'],
];

function fromPattern(text: string): string | null {
  for (const [re, out] of PATTERNS) {
    const m = text.match(re);
    if (m) return out.replace('{0}', hindi[m[1]] ?? m[1]);
  }
  return null;
}

/**
 * Keys are the English strings themselves. A missing Hindi entry falls back to English
 * (never to a blank), so an untranslated string is visible rather than broken.
 * `{name}` placeholders are filled from `vars`. Amounts and dates are formatted by the
 * caller and are identical in both languages.
 */
export function translate(language: Language, text: string, vars?: Record<string, string | number>): string {
  const template = language === 'hindi' ? (hindi[text] ?? fromPattern(text) ?? text) : text;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}
