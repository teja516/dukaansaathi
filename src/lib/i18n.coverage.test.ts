import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Hindi coverage', () => {
  it('every UI string and server message has a Hindi translation (node scripts/check-i18n.mjs)', () => {
    let out = '';
    try {
      out = execFileSync('node', ['scripts/check-i18n.mjs'], { encoding: 'utf8' });
    } catch (err) {
      out = (err as { stdout?: string }).stdout ?? String(err);
      throw new Error('Missing Hindi translations:\n' + out);
    }
    expect(out).toContain('0 without Hindi');
  });
});
