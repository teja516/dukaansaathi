// End-to-end acceptance checks against a RUNNING app (npm run dev), taken from the spec's
// test matrix (12.3) and security checklist (18.11). It creates two throwaway accounts and
// removes them afterwards.
//
//   npm run test:acceptance            (BASE_URL defaults to http://localhost:3000)
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const BASE = (process.env.BASE_URL || 'http://localhost:3000') + '/api';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
// Responses wrap single entities as { thing: {...} }.
const un = (b) => (b && typeof b === 'object' && !Array.isArray(b) && Object.keys(b).length === 1 ? Object.values(b)[0] : b);
const key = () => randomBytes(6).toString('hex');
const ymd = (offset = 0) => new Date(Date.now() + 5.5 * 3600e3 + offset * 86400e3).toISOString().slice(0, 10);

const created = [];
async function makeUser(tag) {
  const email = `accept-${tag}-${key()}@example.com`;
  const password = randomBytes(12).toString('base64url');
  created.push(email);
  await call('POST', '/auth/register', { name: `Accept ${tag}`, email, password });
  const login = await call('POST', '/auth/login', { email, password });
  const token = login.body.token;
  const shop = un((await call('POST', '/shops', { shopName: `Accept ${tag}`, openingCashBalancePaise: 100000, openingBankBalancePaise: 0, interfaceLanguage: 'english' }, token)).body);
  await call('POST', `/shops/${shop.id}/complete-setup`, { reviewConfirmed: true }, token);
  return { email, password, token, shop };
}
const cash = async (t) => (await call('GET', '/available-cash', undefined, t)).body.available_paise;

try {
  const A = await makeUser('a');
  const Bu = await makeUser('b');
  const T = A.token;
  const today = ymd(0);

  const cust = un((await call('POST', '/customers', { name: 'Cust One' }, T)).body);
  const sup = un((await call('POST', '/suppliers', { name: 'Sup One' }, T)).body);

  // ---- cash rules
  const cash0 = await cash(T);
  const tx = un((await call('POST', '/credit-transactions', { customerId: cust.id, amountPaise: 100000, transactionDate: today, expectedPaymentDate: ymd(10) }, T)).body);
  check('Credit sale does not increase available cash', (await cash(T)) === cash0);
  const bill = un((await call('POST', '/supplier-bills', { supplierId: sup.id, amountPaise: 50000, billDate: today, dueDate: ymd(5) }, T)).body);
  check('Supplier bill creation does not reduce cash', (await cash(T)) === cash0);
  const exp = un((await call('POST', '/expenses', { category: 'rent', amountPaise: 30000, expenseDate: today, dueDate: ymd(3), status: 'unpaid', idempotencyKey: key() }, T)).body);
  check('Unpaid expense does not reduce cash', (await cash(T)) === cash0);
  await call('POST', `/expenses/${exp.id}/mark-paid`, { payment_date: today }, T);
  check('Marking an expense paid reduces cash exactly once', (await cash(T)) === cash0 - 30000);
  check('Marking it paid again is rejected', (await call('POST', `/expenses/${exp.id}/mark-paid`, { payment_date: today }, T)).status === 409);

  // ---- customer payments
  const pay = (amount, k = key()) => call('POST', '/customer-payments', { customerId: cust.id, creditTransactionId: tx.id, amountPaise: amount, paymentDate: today, paymentMethod: 'cash', idempotencyKey: k }, T);
  check('Payment greater than remaining is rejected', (await pay(100001)).status === 400);
  const k1 = key();
  await pay(20000, k1);
  await pay(20000, k1);
  const list = un((await call('GET', `/customer-payments?customer_id=${cust.id}`, undefined, T)).body);
  check('Duplicate submit (same key) creates one payment', list.length === 1, `${list.length} records`);
  const race = await Promise.all([pay(60000), pay(60000)]);
  check('Two simultaneous payments cannot both succeed on a stale balance', race.map((r) => r.status).sort().join() === '201,400', race.map((r) => r.status).join());
  const detail = (await call('GET', `/credit-transactions/${tx.id}`, undefined, T)).body;
  check('Remaining balance never goes negative', detail.remaining_amount_paise >= 0);

  // ---- reversal
  const c0 = await cash(T);
  const paymentId = list[0].id;
  check('Reversal needs a reason', (await call('POST', `/customer-payments/${paymentId}/reverse`, { reason: '' }, T)).status === 400);
  check('Reversal succeeds', (await call('POST', `/customer-payments/${paymentId}/reverse`, { reason: 'mistake' }, T)).status === 200);
  check('Reversal takes the money back out of cash', (await cash(T)) === c0 - 20000);
  check('Reversing twice is rejected', (await call('POST', `/customer-payments/${paymentId}/reverse`, { reason: 'again' }, T)).status === 409);
  check('A credit with payment history cannot be deleted', (await call('DELETE', `/credit-transactions/${tx.id}`, undefined, T)).status === 409);

  // ---- supplier FIFO + overpayment
  await call('POST', '/supplier-bills', { supplierId: sup.id, amountPaise: 20000, billDate: today, dueDate: ymd(40) }, T);
  const sp = un((await call('POST', '/supplier-payments', { supplierId: sup.id, amountPaise: 60000, paymentDate: today, paymentMethod: 'bank', idempotencyKey: key() }, T)).body);
  const bills = un((await call('GET', '/supplier-bills', undefined, T)).body).sort((a, b) => a.due_date.localeCompare(b.due_date));
  check('Supplier payment settles the oldest-due bill first, then the next', bills[0].remaining_amount_paise === 0 && bills[1].remaining_amount_paise === 10000, bills.map((b) => b.remaining_amount_paise).join());
  check('Supplier overpayment is rejected', (await call('POST', '/supplier-payments', { supplierId: sup.id, amountPaise: 99999999, paymentDate: today, paymentMethod: 'cash', idempotencyKey: key() }, T)).status === 400);
  await call('POST', `/supplier-payments/${sp.id}/reverse`, { reason: 'wrong supplier' }, T);
  const after = un((await call('GET', '/supplier-bills', undefined, T)).body).sort((a, b) => a.due_date.localeCompare(b.due_date));
  check('Supplier reversal restores every bill it paid', after[0].remaining_amount_paise === 50000 && after[1].remaining_amount_paise === 20000);

  // ---- forecast + what-if
  await call('POST', '/supplier-bills', { supplierId: sup.id, amountPaise: 1111, billDate: today, dueDate: ymd(30) }, T);
  await call('POST', '/supplier-bills', { supplierId: sup.id, amountPaise: 2222, billDate: today, dueDate: ymd(31) }, T);
  const f30 = (await call('GET', '/cash-forecast?period=30', undefined, T)).body.events.map((e) => e.amount_paise);
  check('30-day forecast includes day 30 and excludes day 31', f30.includes(1111) && !f30.includes(2222));
  const tx2 = un((await call('POST', '/credit-transactions', { customerId: cust.id, amountPaise: 40000, transactionDate: today, expectedPaymentDate: ymd(8) }, T)).body);
  const before = (await call('GET', `/credit-transactions/${tx2.id}`, undefined, T)).body.credit_transaction.expectedPaymentDate;
  await call('GET', `/what-if-scenario?credit_transaction_id=${tx2.id}&delay_days=15`, undefined, T);
  const afterDate = (await call('GET', `/credit-transactions/${tx2.id}`, undefined, T)).body.credit_transaction.expectedPaymentDate;
  check('What-if leaves the real record unchanged', before === afterDate);

  // ---- isolation (B attacks A)
  check("Another shop cannot read this shop's customer", (await call('GET', `/customers/${cust.id}`, undefined, Bu.token)).status === 404);
  check("Another shop cannot pay this shop's bill", [400, 404].includes((await call('POST', '/supplier-payments', { supplierBillId: bill.id, amountPaise: 100, paymentDate: today, paymentMethod: 'cash', idempotencyKey: key() }, Bu.token)).status));
  check("Another shop cannot read this shop's settings", (await call('GET', `/shops/${A.shop.id}`, undefined, Bu.token)).status === 404);
  check("Another shop cannot add credit to this shop's customer", [400, 404].includes((await call('POST', '/credit-transactions', { customerId: cust.id, amountPaise: 100, transactionDate: today }, Bu.token)).status));
  check('Unauthenticated requests are rejected', (await call('GET', '/dashboard')).status === 401);

  // ---- validation
  check('Impossible date is rejected with a 4xx', (await call('POST', '/credit-transactions', { customerId: cust.id, amountPaise: 100, transactionDate: '2026-13-45' }, T)).status === 400);
  check('Fractional paise are rejected', (await call('POST', '/credit-transactions', { customerId: cust.id, amountPaise: 10.5, transactionDate: today }, T)).status === 400);
  check('Very long text is rejected', (await call('POST', '/customers', { name: 'x'.repeat(5000) }, T)).status === 400);
  check('A malformed id is "not found", not a server error', (await call('GET', '/customers/not-a-uuid', undefined, T)).status === 404);
  check('A malformed id in a body is a 400', (await call('POST', '/credit-transactions', { customerId: 'nope', amountPaise: 100, transactionDate: today }, T)).status === 400);
  await call('POST', '/customers', { name: 'Dup Name' }, T);
  const dup = await call('POST', '/customers', { name: 'Dup Name' }, T);
  check('A same-name customer triggers a duplicate warning', dup.status === 409 && dup.body.duplicate === true);
  check('...and can be saved anyway after confirming', (await call('POST', '/customers', { name: 'Dup Name', confirmDuplicate: true }, T)).status === 201);
  check('Errors do not leak internals', !/select |at .*\.(ts|js)|postgres/i.test(JSON.stringify((await call('GET', '/customers/not-a-uuid', undefined, T)).body)));

  // ---- security
  const h = (await call('GET', '/auth/me')).headers;
  check('Security headers are set (CSP, nosniff)', !!h.get('content-security-policy') && h.get('x-content-type-options') === 'nosniff');
  let last = 0;
  for (let i = 0; i < 6; i++) last = (await call('POST', '/auth/login', { email: Bu.email, password: 'wrong-' + i })).status;
  check('Login locks the account after repeated failures', last === 429, `last status ${last}`);
} finally {
  // Remove the throwaway accounts (development database only).
  try {
    const list = created.map((e) => `'${e}'`).join(',');
    const sql = `begin; create temp table s as select shop_id from users where email in (${list}) and shop_id is not null;
      delete from audit_events where shop_id in (select shop_id from s); delete from alerts where shop_id in (select shop_id from s);
      delete from cash_movements where shop_id in (select shop_id from s); delete from customer_payment_allocations where shop_id in (select shop_id from s);
      delete from supplier_payment_allocations where shop_id in (select shop_id from s); delete from customer_payments where shop_id in (select shop_id from s);
      delete from supplier_payments where shop_id in (select shop_id from s); delete from expenses where shop_id in (select shop_id from s);
      delete from supplier_bills where shop_id in (select shop_id from s); delete from credit_transactions where shop_id in (select shop_id from s);
      delete from customers where shop_id in (select shop_id from s); delete from suppliers where shop_id in (select shop_id from s);
      delete from users where email in (${list}); delete from shops where id in (select shop_id from s); commit;`;
    execSync('docker exec -i dukaan-pg psql -U postgres -d app -v ON_ERROR_STOP=1', { input: sql, stdio: ['pipe', 'ignore', 'ignore'] });
  } catch {
    console.warn(`(could not remove test accounts automatically: ${created.join(', ')})`);
  }
}

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name.padEnd(width)}${r.ok || !r.detail ? '' : '  ' + r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
