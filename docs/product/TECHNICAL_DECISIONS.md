# Technical decisions

Short record of why the build is the way it is. See `docs/BUSINESS_RULES.md` for the rules themselves.

| Decision | Why |
|---|---|
| One Next.js app (modular monolith) with route handlers as the API | One deployable unit, no service boundaries to maintain for a solo build (spec 18.2). |
| Postgres + Drizzle, money as integer paise | Exact arithmetic, relational integrity, CHECK constraints on amounts (spec 8.3, 18.5). |
| Business rules in `src/modules/<name>/service.ts`; arithmetic of the forecast in a pure `ledger.ts` | UI never calculates totals (spec 5.4); the rules can be unit tested without a database. |
| Modules are imported only through their `index.ts` (lint rule) | Keeps boundaries honest. |
| Payments run in a DB transaction with row locks, a unique idempotency key and a re-check of the remaining amount | Stops overpayment, duplicate submits and races (spec 18.5). Proven by the acceptance script. |
| Reversal records instead of deleting payments | Financial history is never silently rewritten (spec 2.4, 18.5, 18.6). |
| Allocation: oldest first by default, manual choice allowed | Approved decision, spec 21.1 and 21.2. |
| Overdue / undated collections excluded and listed | Approved decision, spec 21.3 and 21.5; avoids implying certainty. |
| Safety threshold defaults to ₹0 and is labelled a system default | Approved decision, spec 21.4. |
| All dates are the India (IST) calendar date | Approved decision, spec 21.6. |
| Password hashing with Node's built-in scrypt; session = signed JWT (jose) in an HttpOnly cookie | No extra dependency, no plaintext or reversible storage. The spec lists bcryptjs/Auth.js as the planned choice; this meets the same requirement with fewer dependencies. |
| Sessions use the cookie only, no token in localStorage | Spec 18.4. The tradeoff: a page embedded in a cross-site iframe (some preview panes) will not hold a login. |
| In-memory rate limiter for public auth routes | Enough for one process; documented limit. |
| Own tiny i18n (typed dictionary keyed by the English text; missing Hindi falls back to English) | Spec 21.9: no runtime library. A test checks placeholders match in both languages. |
| No chart library: a small SVG chart with axis labels, touch/hover readout, and keyboard stepping | Fewer dependencies; labels and a text summary make it readable (spec Screen 10). |
| What-if is computed in memory and never stored | Spec 21.9; it cannot alter records. |
| Reminder text is a template, not AI | Numbers and wording are predictable; spec 8.5. |
| Vitest 3 for unit tests | Latest Vitest requires newer Node typings than this project uses. |

## Not done on purpose

Sending WhatsApp/SMS, email delivery for password reset, multi-user roles, exporting data from the screens,
a saved Scenario table. See spec Part 13 (P2) and docs/OPERATIONS.md.
