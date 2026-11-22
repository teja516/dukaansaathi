# Business rules

Each rule says where it lives and how it is tested. "Spec" numbers refer to
`docs/product/DukaanSaathi_Final_Product_Specification.md`.

## Money

- All amounts are integer **paise** (spec 8.3, 21.9). Screens convert rupee text with `rupeesToPaise`
  (`src/lib/utils.ts`), which never goes through floating point. Tested in `src/lib/logic.test.ts`.
- The database refuses non-positive amounts and a "remaining" outside `0..amount` (CHECK constraints in `src/db/schema.ts`).
- Currency is INR; amounts are shown with Indian digit grouping (₹1,23,456).

## What counts as cash

| Event | Changes available cash? |
|---|---|
| Credit sale (udhaar) given | No. It raises what the customer owes. |
| Customer payment received | Yes, + on the payment date, by method (cash / UPI / bank) |
| Supplier bill recorded | No. It raises what the shop owes. |
| Supplier payment made | Yes, - |
| Expense recorded as unpaid | No. It is a future obligation. |
| Expense paid / marked paid | Yes, - exactly once |
| Reversal of a payment | Yes, an opposite entry on the day of reversal |

`Available cash = opening cash + opening bank/UPI + inflows - outflows` (`src/modules/available-cash`).
A payment is recorded once and is never also an expense (spec 9.5). Checked by `npm run test:acceptance`.

## Owed amounts

- Customer outstanding = sum of the remaining amount on open credit sales. Supplier outstanding likewise for bills.
  Remaining amounts are changed only by payments, reversals and edits, all inside database transactions.
- A customer payment is applied **oldest credit first** unless a specific credit is chosen (spec 21.1).
  A supplier payment is applied **oldest due bill first** within the chosen supplier unless a bill is chosen (21.2).
  Shared by `src/lib/allocation.ts`; tested.
- A payment larger than what is owed is rejected, re-checked inside the transaction with a row lock, so two
  simultaneous payments cannot both pass on a stale balance (spec 18.5).
- Every payment carries a unique idempotency key; sending the same one again returns the original (no duplicate).
- Edits cannot reduce an amount below what is already paid.

## Corrections

- A payment is never deleted. A **reversal** marks it reversed (with a reason and who did it), restores the
  credit sales or bills it settled, and posts an opposite cash movement. A payment can be reversed once.
- A credit sale, bill, customer or supplier with history cannot be deleted. Edit the amount instead.
- Every create / edit / reversal writes an audit event with before and after values of the changed fields
  (shown in Settings > Activity log).

## Forecast (30 / 60 / 90 days)

Implemented in `src/modules/cash-forecast/ledger.ts` (pure, unit tested in `ledger.test.ts`):

1. Start with today's actual available cash.
2. Add an open credit on its **expected payment date**, if that date is today or later and inside the period.
3. Subtract unpaid supplier bills and unpaid expenses on their due dates.
4. Closing balance of a day = previous closing + inflows - outflows. The lowest balance and its first date are reported.

Uncertainty (spec 9.6, 21.3, 21.5): an **overdue** collection and a credit with **no expected date** are
**excluded** from the forecast and listed separately with the reason. Setting a new expected date (today or
later) brings it back. Bills and expenses already overdue are still owed, so they are counted today and flagged.
"Today" is the India (IST) calendar date everywhere.

## Cash Survival Radar and alerts

- **Shortage**: lowest projected balance is below the safety amount (default ₹0, labelled as a system default, configurable in Settings).
- **Keep an eye**: no shortage, but the lowest balance is under 25% of today's cash.
- **Normal**: otherwise. (`src/modules/cash-survival-radar/risk.ts`, tested.)
- Alerts are produced by fixed rules, ordered: projected shortage, overdue receivables while a shortage is projected,
  bills and expenses due within 7 days or overdue, other overdue receivables, data reminders. They resolve on their own
  when the condition ends. Marking an alert reviewed never changes a financial record.

## What-if

"A customer pays N days late" (default 15, 1 to 90). The forecast is recomputed in memory with that one collection
moved; nothing is stored and no record changes. Overdue or undated credits cannot be simulated (they are not in the
forecast). The result lists each payment and bill up to the low point with the balance normally and if late.

## No AI in the numbers

Every figure is calculated by the code above. Reminder messages are templates filled from the current outstanding
amount; nothing is sent automatically.
