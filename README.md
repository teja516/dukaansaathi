<div align="center">

# DukaanSaathi

**Know your shop's cash before it runs short.**

### 🔗 [Live demo: https://dukaansaathi-liart.vercel.app](https://dukaansaathi-liart.vercel.app)

A bilingual (English / हिन्दी) cash-flow assistant for owner-run kirana and neighbourhood shops.
Track customer credit (udhaar), supplier bills and expenses, see your real cash today, and see what your
cash may look like over the next 30, 60 and 90 days.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-45%20unit%20%2B%2034%20e2e-brightgreen)

</div>

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [API overview](#api-overview)
- [Testing](#testing)
- [Security](#security)
- [Performance](#performance)
- [Internationalisation](#internationalisation)
- [Documentation](#documentation)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Why this exists

A kirana shopkeeper usually knows how much cash is in the drawer, but not which customers owe how much and
for how long, which supplier bill is due next, or whether the money coming in will arrive before the bills
fall due. The notebook records what happened. DukaanSaathi also shows **what may happen next**, and is
explicit about what it knows and what it is estimating.

It is deliberately **not** a point-of-sale, an inventory system, or a tax tool.

## Features

| Area | What you can do |
|---|---|
| **Udhaar (customer credit)** | Record credit sales with an expected payment date, take full or part payments (oldest credit first, or pick one), see balances and status, draft polite reminders in Hindi or English. |
| **Suppliers** | Record bills with due dates, pay them (oldest-due first, or pick one), see what you owe each supplier. |
| **Expenses** | Rent, electricity, wages, transport and other costs, paid or still to pay. Unpaid expenses appear in the forecast on their due date. |
| **Available cash** | Opening balances plus money actually received minus money actually paid, split into cash in hand and bank/UPI. |
| **Cash forecast** | 30 / 60 / 90 day projection with the lowest point, a readable chart (₹ axis, touch/hover readout) and the assumptions behind it. |
| **Cash Survival Radar** | Normal / keep an eye / possible shortage, with the collections and bills that drive the result. |
| **What-if** | "What if this customer pays 15 days late?" with a day-by-day view of which bills get tight. Never changes real records. |
| **Action Centre** | A short, ordered to-do list (overdue money, bills due, shortage risk) with a direct action on each item. |
| **Corrections** | Edit amounts and dates, reverse a mistaken payment (history is kept, nothing silently rewritten), and an activity log with before/after values. |
| **Bilingual** | Every screen, message and server error in English and Hindi, switchable anywhere without losing your place. |
| **Responsive** | Designed phone-first; checked from 320 px phones to desktop. |

## Tech stack

- **Framework:** Next.js 15 (App Router) and React 18, TypeScript throughout
- **UI:** Tailwind CSS, Radix UI primitives, lucide icons, a small hand-written SVG chart
- **Data:** PostgreSQL 16, Drizzle ORM, postgres.js. Money is stored as **integer paise**
- **Validation and auth:** Zod, scrypt password hashing, signed JWT sessions (jose) in an HttpOnly cookie
- **Quality:** Vitest (unit), a scripted end-to-end acceptance suite, ESLint, strict TypeScript
- **Tooling:** Docker Compose for the local database

## Getting started

### Prerequisites

- Node.js 20 or newer
- Docker Desktop (running). It hosts the local PostgreSQL database

### Install and run

```bash
git clone https://github.com/teja516/dukaansaathi.git
cd dukaansaathi

npm install
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
# open .env and set DEMO_PASSWORD (and change AUTH_SECRET)

npm run dev
```

`npm run dev` does everything in order: it starts PostgreSQL in Docker, creates the tables, seeds the demo
data on the first run, starts the app, and then pre-compiles every page in the background so pages open
instantly afterwards (a few minutes on a slow machine; `WARM=0 npm run dev` skips this).

Open **http://localhost:3000**. Visitors see the landing page; signed-in shopkeepers see their dashboard.

### Demo accounts

Sign in as `demo@example.com` (or `shopkeeper@example.com`) with the `DEMO_PASSWORD` you set in `.env`.
The demo shop ("श्री लक्ष्मी जनरल स्टोर्स") contains made-up customers, bills and expenses, each marked
**Sample** on screen. Nothing in it is real data.

### Deploy it for free

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for a step-by-step guide to hosting on Vercel (app) and Neon (PostgreSQL), both free to start.

### Production build

```bash
npm run demo                # database + production build + start
```

Production serves pages in about 10 ms and API calls in about 10 to 40 ms (measured on a slow laptop).
Judge speed on this, not on `npm run dev`, which compiles on demand by design.

## Configuration

Copy `.env.example` to `.env`. Every variable below is read by the app.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. The default matches `docker-compose.yml`. |
| `AUTH_SECRET` | yes | Long random string that signs session tokens. **Change it before deploying.** |
| `SESSION_COOKIE_NAME` | no | Name of the session cookie. Default `app_session`. |
| `DEMO_PASSWORD` | for the seed | Password of the seeded demo accounts. If unset, nobody can sign in as them. |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL, used for link metadata. Default `http://localhost:3000`. |

`.env` is git-ignored. Never commit real secrets.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the database, then the app, then pre-compile all routes. |
| `npm run demo` | Production build and start. |
| `npm test` | 45 unit tests for the financial rules and helpers. No database needed. |
| `npm run test:acceptance` | 34 end-to-end checks against the running app (see [Testing](#testing)). |
| `npm run check:i18n` | Fails if any UI text or server message has no Hindi translation. |
| `npm run typecheck` / `npm run lint` | Static checks. |
| `npm run db:up` | Start PostgreSQL, create tables, seed on first run. |
| `npm run db:push` | Apply edits to `src/db/schema.ts` (run in a terminal; it can ask before dropping data). |
| `npm run db:seed` | Create the demo accounts if missing. |
| `npm run db:down` | Stop the database container (the data is kept). |
| `node scripts/perf-check.mjs [url]` | Time every API route and page. |

## Project structure

```text
src/
  app/                 Pages (App Router) and the HTTP API (app/api/**/route.ts)
  components/          Reusable UI: shell, cards, forms, chart, dialogs, landing page
  modules/<name>/      One folder per business area (customers, suppliers, cash-forecast, ...).
                       service.ts holds the rules. Other code imports only from the module's index.ts
                       (enforced by ESLint).
  lib/                 Shared helpers: money and date formatting, auth, input guards, translations, API client
  hooks/               React hooks (language, async data, unsaved-changes guard, ...)
  db/                  schema.ts (tables and constraints) and seed.ts (demo data)
scripts/               Dev launcher, database startup, acceptance suite, i18n check, perf check
docs/                  Business rules, operations guide, product specification and decisions
docker-compose.yml     Local PostgreSQL
```

## How it works

```text
Screens  ->  src/lib/api.ts (the only place that calls fetch)
         ->  API routes: authenticate, validate input (Zod + guards), call a module service
         ->  Module services: business rules, database transactions
         ->  PostgreSQL via Drizzle (every query is scoped to the signed-in user's shop)
```

The forecast arithmetic is a **pure function** (`src/modules/cash-forecast/ledger.ts`) with no database or
clock, so the financial rules are unit-tested directly.

### The rules that matter

Written out in full, with where each lives and how it is tested, in [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md).

- Money is integer paise. A credit sale or a supplier bill **never** changes cash; only recorded payments do.
- A payment can never exceed what is owed, and cannot be saved twice (idempotency keys, row locks inside a
  transaction, so two simultaneous requests cannot both pass on a stale balance).
- Mistakes are **reversed**, never deleted. The original entry stays in the history, marked reversed.
- Overdue and undated customer payments are **left out** of the forecast and listed with the reason, until
  the owner sets a new expected date.
- All dates are the India (IST) calendar date.
- Every number is calculated by code. No AI is involved in any figure.

### Data model

14 tables: `shops`, `users`, `customers`, `suppliers`, `credit_transactions`, `customer_payments`,
`customer_payment_allocations`, `supplier_bills`, `supplier_payments`, `supplier_payment_allocations`,
`expenses`, `cash_movements`, `alerts`, `audit_events`. Amounts have `CHECK` constraints (positive, and
remaining within `0..amount`). See [`src/db/schema.ts`](src/db/schema.ts).

## API overview

All routes are under `/api`, return JSON, require a session (except sign-in and sign-up) and are scoped to the
caller's shop.

| Group | Routes |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`; `GET`/`PATCH /auth/me` |
| Shop | `POST /shops`, `GET`/`PATCH /shops/:id`, `POST /shops/:id/complete-setup`, `POST /shops/:id/sample-data` |
| Customers | `GET`/`POST /customers`, `GET`/`PATCH`/`DELETE /customers/:id`, `GET /customers/:id/reminder-draft` |
| Credit | `GET`/`POST /credit-transactions`, `GET`/`PATCH`/`DELETE /credit-transactions/:id` |
| Customer payments | `GET`/`POST /customer-payments`, `GET /customer-payments/preview`, `GET /customer-payments/:id/allocations`, `POST /customer-payments/:id/reverse` |
| Suppliers and bills | `/suppliers`, `/supplier-bills` (list, create, read, update, delete) |
| Supplier payments | `GET`/`POST /supplier-payments`, `GET /supplier-payments/preview`, `.../allocations`, `POST .../reverse` |
| Expenses | `GET`/`POST /expenses`, `GET`/`PATCH /expenses/:id`, `POST /expenses/:id/mark-paid`, `POST /expenses/:id/cancel` |
| Money and insight | `GET /available-cash`, `/cash-movements`, `/cash-forecast?period=30\|60\|90`, `/cash-survival-radar`, `/what-if-scenario`, `/dashboard` |
| Alerts and audit | `GET /alerts`, `POST /alerts/sync`, `POST /alerts/:id/review`, `POST /alerts/:id/take-action`, `GET /audit-events` |

Errors are `{ "error": "message" }` with a sensible status (400 validation, 401 not signed in, 404 not found,
409 conflict, 429 rate limited). Messages are translated to the user's language on the client.

## Testing

```bash
npm test                    # 45 unit tests (forecast ledger, allocation, risk rules, money/date helpers, translations)
npm run test:acceptance     # 34 end-to-end checks against the running app
npm run check:i18n          # every string has a Hindi translation
npm run typecheck && npm run lint
```

The acceptance suite (`scripts/acceptance.mjs`) creates two throwaway accounts and cleans them up. It checks, among
other things: credit sales and bills do not move cash; a paid expense moves cash exactly once; overpayment is
rejected; duplicate submits create one record; two simultaneous payments cannot both succeed; reversals restore
balances and cash; one shop cannot read or pay another shop's records; invalid dates, ids and over-long text are
rejected; and security headers and login lockout are in place.

## Security

- Passwords hashed with scrypt; sessions are signed tokens in an **HttpOnly** cookie (nothing in browser storage).
- Every business query is scoped to the signed-in user's shop; cross-shop access returns 404.
- Server-side validation of every input: ids must be UUIDs, dates must be real, text length and body size are capped.
- Login lockout after repeated failures and a rate limit on the public auth routes.
- Security headers (CSP, `nosniff`, referrer and permissions policy; framing blocked and HSTS in production).
- Reset links are never emailed in development; they are printed to the server log (no email service is connected).

Report a vulnerability by opening a private security advisory on the repository.

## Performance

Measured on a slow Windows laptop (production build, warm): API **9 to 40 ms**, page HTML **6 to 10 ms**.
What keeps it fast: parallel queries on the dashboard, the forecast computed once per request, database
connections kept open and opened at startup, no database writes on read when nothing changed, and no
prefetching of every record page. Run `node scripts/perf-check.mjs` to measure your own machine.

## Internationalisation

English and Hindi are supported everywhere, including server error messages and the landing page.

- Keys are the English strings themselves; the Hindi dictionary is `src/lib/i18n.hi.ts`.
- Amounts (₹, Indian digit grouping) and dates are identical in both languages. Names you type are not translated.
- `npm run check:i18n` (also part of the test suite) fails if anything is missing a Hindi translation.

## Documentation

| Document | What it covers |
|---|---|
| [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) | Every financial rule, where it lives and how it is tested |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Database backup and restore, production checklist, troubleshooting |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying for free (Vercel + Neon), step by step |
| [docs/product/DukaanSaathi_Final_Product_Specification.md](docs/product/DukaanSaathi_Final_Product_Specification.md) | The product requirements |
| [docs/product/TECHNICAL_DECISIONS.md](docs/product/TECHNICAL_DECISIONS.md) | Why the build is the way it is |
| [docs/product/IMPLEMENTATION_STATUS.md](docs/product/IMPLEMENTATION_STATUS.md) | What is done and what is not |

## Known limitations

- Password-reset email is not connected (the link is logged in development).
- The rate limiter is in memory, so it only protects a single server process.
- No automatic backups and no data export from the screens (see the operations guide).
- Out of scope for this version: WhatsApp/SMS sending, voice entry, receipt scanning, bank import, inventory,
  GST or tax filing, multiple users and roles, multiple shops.
- Forecasts are only as good as the dates entered. They are estimates, not financial advice.

## Contributing

1. Create a branch and make your change.
2. Run `npm run typecheck`, `npm run lint` and `npm test`. With the app running, also run `npm run test:acceptance`.
3. If you add UI text or a server message, add its Hindi translation (`npm run check:i18n` will tell you).
4. If you change a financial rule, update `docs/BUSINESS_RULES.md` and add a test.
5. Open a pull request describing what changed and why.

## License

No open-source licence has been chosen yet, so all rights are reserved by the author until one is added.
