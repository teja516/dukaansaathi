// Lists every English string passed to t() (and the label tables that feed it) that has no Hindi entry.
// Run: node scripts/check-i18n.mjs        Exit code 1 when something is missing.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const strings = new Set();
const skip = (p) => /[\\/](api|_internal)[\\/]|i18n|\.test\./.test(p) || p.endsWith('PageSkeleton.tsx');

(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(name) && !skip(full)) scan(readFileSync(full, 'utf8'));
  }
})('src');

function scan(src) {
  const grab = (re, g = 1) => {
    for (const m of src.matchAll(re)) strings.add(m[g].replace(/\\'/g, "'"));
  };
  grab(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g);
  grab(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g);
  grab(/\bt\(\s*`((?:[^`\\$]|\\.)*)`/g);
  // messages the server sends back (shown to the user in their language)
  grab(/HttpError\(\s*\d+,\s*'((?:[^'\\]|\\.)*)'/g);
  grab(/\b(?:label|title|text|l): '((?:[^'\\]|\\.)*)'/g);
  grab(/\['\w+', '((?:[^'\\]|\\.)*)'\]/g);
  // string arrays rendered through t(): HONEST list and hero bullets on the landing page
  for (const blk of src.matchAll(/const HONEST = \[(.*?)\] as const;/gs)) for (const m of blk[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) strings.add(m[1]);
  for (const m of src.matchAll(/\['(Works in English and Hindi[^\]]*)\]/g)) for (const q of m[0].matchAll(/'((?:[^'\\]|\\.)*)'/g)) strings.add(q[1]);
}

const dict = readFileSync('src/lib/i18n.hi.ts', 'utf8');
const keys = new Set();
for (const m of dict.matchAll(/^ {2}'((?:[^'\\]|\\.)*)':/gm)) keys.add(m[1].replace(/\\'/g, "'"));
for (const m of dict.matchAll(/^ {2}"((?:[^"\\]|\\.)*)":/gm)) keys.add(m[1]);

const ignore = new Set(['english', 'hindi', 'on', 'outflow', 'overdue', 'updated_at', 'inflow', 'cash', 'upi', 'bank']);
const missing = [...strings].filter((s) => s && /[A-Za-z]/.test(s) && !keys.has(s) && !ignore.has(s) && !/^[a-z_]+$/.test(s) && !s.startsWith('/') && !s.startsWith('#')).sort();
console.log(`${strings.size} UI strings, ${keys.size} Hindi entries, ${missing.length} without Hindi`);
for (const m of missing) console.log(' - ' + m);
process.exit(missing.length ? 1 : 0);
