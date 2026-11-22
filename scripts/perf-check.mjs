import { readFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3100';
const env = readFileSync('.env', 'utf8');
const PW = env.match(/^DEMO_PASSWORD=(.*)$/m)[1].trim().replace(/^"|"$/g, '');

async function time(url, init, runs = 6) {
  const out = [];
  for (let i = 0; i < runs; i++) {
    const s = performance.now();
    const r = await fetch(url, init);
    await r.arrayBuffer();
    out.push({ ms: performance.now() - s, status: r.status });
  }
  return out;
}
const fmt = (a) => `first ${a[0].ms.toFixed(0).padStart(5)}ms | then ${a.slice(1).map((x) => x.ms.toFixed(0)).join(', ')}ms  [${a[0].status}]`;

const login = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'demo@example.com', password: PW }) });
const token = (await login.json()).token;
const H = { headers: { Authorization: 'Bearer ' + token } };

console.log('== API (' + BASE + ')');
for (const p of ['auth/me', 'dashboard', 'cash-forecast?period=30', 'cash-forecast?period=90', 'cash-survival-radar', 'available-cash', 'customers', 'suppliers', 'alerts', 'supplier-bills', 'expenses', 'audit-events']) {
  console.log(p.padEnd(28), fmt(await time(`${BASE}/api/${p}`, H)));
}
console.log('== Pages (HTML)');
for (const p of ['/login', '/', '/customers', '/cash-forecast', '/action-centre', '/expenses']) {
  console.log(p.padEnd(28), fmt(await time(BASE + p, undefined, 4)));
}
