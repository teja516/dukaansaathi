# DukaanSaathi — Project Context

**Primary references:** `DukaanSaathi_Final_Product_Specification.md` (Parts 0–21; Part 21 overrides earlier open questions) and `README.md`. Read only the part of the specification relevant to your task.

## Product overview
DukaanSaathi is a bilingual (English / Hindi) financial operations and cash-flow app for owner-operated Indian kirana (neighbourhood grocery) shops. It records customer credit (udhaar), customer payments, supplier bills, supplier payments and expenses, then shows actual cash and a 30/60/90-day cash forecast. Event: ACE Builders Hackathon 2026 – Codebenders, problem statement PS1. Currency INR. Timezone Asia/Kolkata.

## Target users
- One primary user: the shopkeeper/owner (1–5 staff, limited time for data entry, may prefer Hindi and simple terms).
- No customer, supplier or accountant logins in the MVP.

## Main features (MVP, Spec Part 13 P0)
1. Shop setup and opening balances.
2. Customers and credit sales (udhaar).
3. Customer payments (full or partial, FIFO or manual selection).
4. Suppliers, supplier bills and supplier payments.
5. Expenses (paid or unpaid).
6. Dashboard with actual available cash, outstanding and overdue amounts, and upcoming obligations.
7. 30/60/90-day cash forecast and Cash Survival Radar (Spec Parts 6.9–6.10).
8. What-if simulator: a selected collection moves 15 days later, in memory only (Spec Part 6.11).
9. Action Centre with rule-based alerts (Spec Part 6.12).
10. Hindi/English reminder drafts (P1).

## Technology stack — status
Nothing in this stack is confirmed or installed yet. Items are PLANNED (Spec Part 21.9):
- TypeScript, Next.js (App Router), Tailwind CSS, Zod, Recharts, Lucide icons.
- PostgreSQL on a free hosted tier, Drizzle ORM.
- Auth.js with credentials login and bcryptjs password hashing.
- Vitest for domain tests; Playwright optional.
- Hosting: UNKNOWN. Codebenders deployment capability has not been verified. Fallback is Vercel Hobby, whose commercial-use terms still need checking.

## Architecture (Spec Part 18.2)
Modular monolith: one deployable app.
- Presentation: bilingual responsive UI. No financial calculations.
- Auth and API boundary: checks user and shop membership on every request.
- Application services: create credit sale, record payment, add bill, add expense.
- Domain layer: pure functions for balances, cash, forecast, scenario and alert rules, with an injected clock. Most heavily tested.
- Persistence: PostgreSQL with transactions and row locks.

## Current folder structure
```
docs/product/                                  (git repository root)
├── DukaanSaathi_Final_Product_Specification.md   (product spec, source of truth)
├── README.md
└── PROJECT_CONTEXT.md                         (this file)
```
No application code, package manifest, database, migrations or test suite exists yet.

## Database and authentication status
- Database: NOT SET UP. PostgreSQL is planned; provider not chosen; limits, backup and region unverified.
- Authentication: NOT SET UP. Auth.js is planned; no login implemented.
- Codebenders built-in database, auth and hosting capabilities: UNVERIFIED.

## Financial rules (Spec Parts 9 and 21)
- Customer outstanding = credit sales − customer payments.
- Supplier outstanding = supplier bills − supplier payments.
- Available cash = opening balances + actual inflows − actual outflows. Credit sales and unpaid bills never count as cash.
- Customer payments: FIFO by default (oldest credit sale first); manual selection allowed; never allocate above the remaining amount.
- Supplier payments: FIFO by default; manual selection allowed; overpayment prevented.
- Overdue customer collections are excluded from the base-case forecast and shown separately. They enter the forecast only after the owner records a revised expected date.
- Expected payment date is optional. Sales without one count toward outstanding but are excluded from forecast inflows.
- Cash safety threshold: system default ₹0, labelled as a default (not a recommended threshold), configurable by owner.
- Money is stored as integer paise. No floating point.
- Payments run in a DB transaction with a row lock and an idempotency key.
- Source records are immutable; corrections are reversal entries.
- The what-if scenario is computed in memory and never saved.
- Alert resolution rules are in Spec Part 21.7.

## Security rules (Spec Part 18.4)
- Authentication required for all private shop data.
- Every protected read and write is scoped to the user's shop. Never trust a shop ID sent by the browser.
- Server-side validation of all inputs. Parameterised queries only.
- User text is escaped on render. No raw HTML from notes or AI output.
- Secrets stay out of source control and the browser bundle.
- HTTPS for deployed traffic. Errors must not expose stack traces or secrets.
- Synthetic demo data only; no real customer or financial data.

## Hackathon constraints (Spec Parts 0, 14, 19)
- Codebenders is mandatory for development. Build from scratch.
- Do not use prohibited external AI coding tools or pre-existing code.
- Confirm with organisers that planning/specification assistance is allowed (not yet confirmed).
- Submission requires a working deployed link, Codebenders usage details, key prompts and development iterations. Screenshots alone are not enough.
- Keep infrastructure at ₹0 where possible, and verify free-tier limits before use.
- Official event rules text has not been provided; the summary in Spec Parts 14–15 is not the official text.

## Working rules for future tasks
- Inspect only files relevant to the task. Do not rescan the repository or re-read the whole specification.
- Update IMPLEMENTATION_STATUS.md and TASK_LOG.md after each completed task, recording only actual results.
- Never invent test results, deployment URLs or platform capabilities. Mark unknowns as UNKNOWN.
