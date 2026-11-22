# DukaanSaathi — Implementation Status

Updated after the build. Only verified results are listed.

## Implemented (verified by `npm test`, `npm run test:acceptance`, typecheck, lint and a production build)
- Shop setup wizard, opening balances, English/Hindi selector, sample data (opt-in, clearly marked "Sample").
- Customers, credit sales, customer payments (oldest-first or chosen credit, preview, review step, reversal).
- Suppliers, bills, supplier payments (oldest-due-first or chosen bill, preview, review step, reversal).
- Expenses (paid / unpaid, mark paid, edit, cancel), upcoming vs history lists.
- Available cash (cash / bank split), dashboard, 30/60/90-day forecast with chart, assumptions and the list of left-out collections.
- Cash Survival Radar, 15-day what-if with a day-by-day view, Action Centre with direct actions and auto-resolution.
- Hindi/English reminder drafts (templates; nothing is sent).
- Edit and delete rules, revised expected date for overdue credit, activity log with before/after values.
- Authentication (scrypt, HttpOnly cookie sessions, lockout, rate limit), shop-level isolation, server-side validation, security headers.

## Tests
- 44 unit tests (forecast ledger, allocation, risk rules, money and date helpers, audit diff, translations).
- 34 end-to-end acceptance checks (see README).

## Known limits
- Password reset email is not connected (link is logged in development).
- Rate limiting is in-memory.
- No automatic backups or in-app export (see docs/OPERATIONS.md).
- Not covered here: hosted deployment, the hackathon compliance and submission items (spec Parts 14 and 16, last block).
