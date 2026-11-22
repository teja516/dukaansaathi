# DUKAANSAATHI
## Product Requirements, UX/UI Design System, Dashboard Blueprint & Hackathon Execution Specification

**Event:** ACE Builders Hackathon 2026 – Codebenders  
**Problem statement:** PS1 – Small Business Operations: The One-Person Back Office  
**Product:** DukaanSaathi  
**Category:** Financial operations and cash-flow visibility for micro-businesses  
**Primary user:** Owner-operated Indian neighbourhood kirana shop  
**Interface languages:** English and Hindi (user-selectable)  
**Currency:** Indian Rupee (INR)  
**Transaction capture:** Manual  
**Deployment model:** Standalone application  
**Build constraint:** Build the application from scratch in Codebenders and comply with the organiser's current rules.

> **Product promise:** दुकान का पैसा कहाँ आ रहा है, कहाँ जा रहा है और आगे कितना बचेगा — अब सब एक जगह।

---

# 0. How to use this document

This is the product and implementation specification. It describes what the product should do, why each feature exists, how users move through it, how the interface should behave, and how to validate it.

It is not application source code. Because the event rules restrict external AI coding tools and pre-existing code, do not copy generated code or import an externally generated implementation into Codebenders. Before using AI-assisted planning documents during the event, confirm with the organisers that planning/specification assistance is permitted. Build and document the actual implementation process inside Codebenders, and retain the prompts and iterations required by the submission rules.

The document distinguishes:
- **Requirement:** functionality the MVP needs.
- **Recommendation:** a design or engineering approach intended to improve quality.
- **Assumption:** a product decision that should be validated with shopkeepers or organisers.

---

# PART 1 — PROBLEM, USER AND PRODUCT STRATEGY

## 1.1 The problem

Small shops often maintain customer credit, supplier dues and operating expenses across notebooks, memory, messaging apps and spreadsheets. The owner may know the current cash in the drawer but still not know:
- Which customers have unpaid balances.
- Which balances are overdue and for how long.
- Which supplier payments are due next.
- Which recurring expenses are approaching.
- Whether expected collections will arrive before major bills.
- Whether a delayed customer payment could create a cash shortage.

The problem is not simply recording transactions. It is the lack of a clear, trustworthy view of the shop's current and near-future cash position.

## 1.2 Target user

**Primary persona: owner-operated kirana shopkeeper**

Typical context:
- Runs one neighbourhood grocery/general store.
- Works alone or with approximately 1–5 people.
- Gives regular customers goods on credit (उधार).
- Buys stock from one or more wholesalers/distributors.
- Pays rent, electricity, wages, transport and miscellaneous expenses.
- Has limited time for data entry.
- May be comfortable with a smartphone but may not be comfortable with accounting terminology.
- Wants quick answers, not a complicated accounting system.

### User's main jobs-to-be-done

1. When I give goods on credit, help me record who owes the money and when I expect it.
2. When a customer pays part of the amount, help me update the balance without doing arithmetic.
3. When a supplier bill arrives, help me remember how much I owe and when it is due.
4. When I pay an expense, help me distinguish paid money from money I still need to pay.
5. Before committing money, help me understand whether upcoming collections are likely to cover upcoming obligations.
6. When money may be short, tell me what needs attention first.

## 1.3 Product scope

DukaanSaathi is a lightweight financial operations companion. It is not:
- A full point-of-sale system.
- A GST filing or tax advisory product.
- An inventory/stock management ERP.
- A bank account or payment processor.
- A credit-scoring or lending product.
- A source of guaranteed financial predictions.

The MVP focuses on:
1. Customer credit and collections.
2. Supplier bills and payments.
3. Operating expenses.
4. Actual cash position.
5. 30/60/90-day forecast.
6. What-if cash stress simulation.
7. Actionable alerts and reminder drafts.

## 1.4 Application panels and user roles

**MVP decision: build one primary panel — the Shopkeeper Panel.**

DukaanSaathi is being built for an owner-operated kirana shop. A single shopkeeper account should be able to manage the shop's customers, credit, collections, suppliers, bills, expenses, cash position, forecast and alerts. Building multiple portals during a short solo hackathon would add authentication, permissions and testing work without proving the core product value.

### Panel 1 — Shopkeeper Panel (MVP)

This is the only required user-facing panel for the hackathon:
- Dashboard and Cash Survival Radar.
- Customer and credit management.
- Customer payment recording.
- Supplier and bill management.
- Expense management.
- Cash position and 30/60/90-day forecast.
- What-if simulator.
- Action Centre and reminder drafts.
- Shop profile, language and settings.

### Future role — Staff/Cashier access (not a separate MVP panel)

If the product is developed beyond the hackathon, the owner may invite a cashier or employee with restricted permissions. Staff access could allow recording credit sales and payments, while preventing access to sensitive settings, business-wide forecasts or owner-only reports. This should be added only after role permissions and audit history are designed.

### Not required

- No separate customer panel: customers do not need to log in to the MVP.
- No supplier panel: suppliers do not need to log in to the MVP.
- No accountant panel: accounting collaboration is outside the MVP.
- No platform super-admin dashboard: it is not needed to demonstrate the PS1 solution.

The application can still contain multiple feature modules and screens while having only one user panel. A panel means a distinct role-based application area, not an individual dashboard card or screen.

## 1.5 Differentiation: Cash Survival Radar

A digital ledger tells the owner what has happened. DukaanSaathi should also help the owner see what may happen next.

The memorable product feature is the **Cash Survival Radar**:
- Shows the projected cash balance over time.
- Identifies the date on which projected cash reaches its lowest point.
- Highlights a possible shortfall against upcoming commitments.
- Explains which expected collections and scheduled payments contribute to the result.
- Lets the owner test a delayed-payment scenario.
- Converts the result into practical next actions.

Do not call an expected collection guaranteed. Label it as expected, uncertain or overdue. Show the assumptions used.

---

# PART 2 — UX FRAMEWORKS AND DESIGN PRINCIPLES

Use the following frameworks as practical design checks. They are not marketing labels to display to users.

## 2.1 Jobs-to-be-Done (JTBD)

Design each screen around the user's task, not around database entities.

Examples:
- Instead of asking the shopkeeper to “create a receivable”, use “नया उधार जोड़ें”.
- Instead of “accounts payable”, use “सप्लायर को देना है”.
- Instead of “cash-flow projection”, use “आगे नकदी का अनुमान”.

**Acceptance test:** A first-time shopkeeper should understand the primary action without knowing accounting terminology.

## 2.2 Progressive disclosure

Show essential information first and secondary details only when needed.

Examples:
- On the dashboard, show total outstanding and overdue amount. Show customer-by-customer details on the customer screen.
- In a quick-entry form, show customer, amount and expected date first. Keep optional description in a secondary field.
- On the forecast, show the projected balance and risk date first. Put detailed assumptions in an expandable “यह अनुमान कैसे बना?” section.

Avoid hiding critical warnings behind multiple taps.

## 2.3 Recognition over recall

Users should not need to remember balances or dates.

Use:
- Customer and supplier names in selectors.
- Recent customers as quick choices where supported.
- Clear date labels.
- Visible outstanding amount while recording a payment.
- A confirmation summary before saving a payment.
- Consistent status labels across lists and details.

## 2.4 Error prevention and recovery

Financial data needs stronger safeguards than ordinary form data.

Use:
- Positive amount validation.
- Date validation.
- Payment ceiling validation.
- Duplicate-submit protection.
- Clear confirmation before a financial record is saved.
- Undo or correction workflow where technically feasible.
- Never silently overwrite a transaction.
- Preserve an audit trail for edits and reversals where supported.

If a transaction has already been used in a forecast, changing it should trigger recalculation.

## 2.5 Nielsen-style usability heuristics

Apply these checks:
1. **Visibility of system status:** show saving, saved, loading and failure states.
2. **Match with the real world:** use everyday Hindi and shopkeeper vocabulary.
3. **User control:** allow cancel, back and correction without losing entered data.
4. **Consistency:** same status colors, labels, date format and button hierarchy throughout.
5. **Error prevention:** validate before saving and explain what needs correction.
6. **Recognition:** show outstanding balance and due date near the action.
7. **Efficiency:** make common actions available from the dashboard.
8. **Minimalism:** avoid charts and metrics that do not lead to a decision.
9. **Helpful errors:** explain the issue and how to fix it.
10. **Help:** provide short contextual explanations for forecast assumptions.

## 2.6 Mobile-first and responsive design

Assume the shopkeeper will primarily use a phone.

Recommended responsive behaviour:
- **Mobile:** one-column layout, bottom navigation or compact navigation, full-width forms, large touch targets, sticky primary action when useful.
- **Tablet:** two-column dashboard where it improves scanning.
- **Desktop:** persistent side navigation, wider tables, dashboard cards in a grid.

Do not simply shrink the desktop UI. Reflow the information based on available width.

## 2.7 Accessibility and readability

Recommendations:
- Use readable Hindi typography.
- Keep body text comfortably legible.
- Maintain strong foreground/background contrast.
- Never communicate status using color alone; include text and/or an icon.
- Use sufficiently large tap targets (aim for approximately 44–48 CSS pixels where practical).
- Ensure keyboard focus is visible.
- Label form fields explicitly; do not rely only on placeholders.
- Support zoom without clipping important controls.
- Avoid dense tables on small screens; use stacked cards or compact rows.

---

# PART 3 — VISUAL DESIGN SYSTEM

## 3.1 Visual personality

The product should feel:
- Trustworthy.
- Calm.
- Practical.
- Local and familiar.
- Financially clear.
- Fast to use.

Avoid a flashy fintech/crypto aesthetic, excessive gradients, glassmorphism, decorative charts and overly technical language.

## 3.2 Suggested visual tokens

These are design recommendations, not mandatory brand colors. Use a restrained palette and verify contrast.

| Token | Suggested treatment | Purpose |
|---|---|---|
| Primary | Deep indigo or dark teal | Main navigation and primary actions |
| Positive | Muted green | Money received, healthy status |
| Warning | Amber | Due soon, attention needed |
| Critical | Muted red | Overdue or projected shortage |
| Neutral | Warm grey | Backgrounds, borders, secondary text |
| Surface | White or very light neutral | Cards and forms |
| Text | Dark charcoal | Main readable content |

Do not use green to imply that all forecasts are certain. Use status text such as “अनुमान” or “संभावित कमी”.

## 3.3 Typography

- Choose a Hindi-capable font with clear Devanagari glyphs.
- Use a consistent type scale: page title, section title, card label, value, body and helper text.
- Use tabular numerals for currency and balances if the font supports them.
- Keep currency values visually prominent.
- Avoid long all-caps labels.
- Do not mix Hindi and English unnecessarily. Technical terms can appear in a small help explanation if no natural Hindi equivalent is clear.

## 3.4 Spacing, layout and cards

Use a consistent spacing scale (for example, multiples of 4 or 8).
- Group related fields.
- Keep enough whitespace between cards.
- Use subtle borders and restrained shadows.
- Avoid placing every small item in a separate card.
- Align currency values and dates consistently.
- Keep the most important number in each card visually dominant.

## 3.5 Component standards

Create reusable UI components for:
- App shell and navigation.
- Page header.
- Metric card.
- Status badge.
- Amount display.
- Date display.
- Search field.
- Filter control.
- Empty state.
- Loading skeleton.
- Error message.
- Confirmation dialog.
- Form field with label/helper/error.
- Transaction list row.
- Alert item.
- Forecast chart and chart legend.
- Primary, secondary and destructive buttons.

A reusable component should have consistent behaviour and appearance across all screens.

## 3.6 Bilingual English/Hindi experience

The entire user-facing application must support both English and Hindi. This is a language switch, not a mixture of English and Hindi labels on the same screen.

Requirements:
- Provide a visible **English | हिन्दी** language selector in onboarding and settings.
- Let the user switch language at any time without losing the current screen, entered form values or saved data.
- Translate navigation, buttons, labels, form validation, empty states, loading/error messages, alerts, confirmations, chart legends and help text.
- Keep dates, amounts and transaction records unchanged when the language changes.
- Use the same underlying data and calculations in both languages.
- Format currency consistently as Indian Rupees (₹), regardless of interface language.
- Use clear, everyday Hindi rather than overly formal accounting terminology.
- Ensure Devanagari fonts render correctly on mobile and desktop.
- Payment reminder drafts should be generated in the language selected by the user, with the ability to switch the draft between English and Hindi before copying.
- Do not translate customer-entered names, shop names, supplier names or free-text notes automatically.

Suggested navigation labels:

| English | Hindi |
|---|---|
| Dashboard | मुख्य पृष्ठ |
| Customers | ग्राहक |
| Suppliers | सप्लायर |
| Expenses | खर्च |
| Cash Forecast | नकदी का अनुमान |
| Action Centre | ज़रूरी कार्रवाइयाँ |
| Add Credit | नया उधार जोड़ें |
| Record Payment | भुगतान दर्ज करें |
| Add Supplier Bill | सप्लायर बिल जोड़ें |
| Add Expense | खर्च जोड़ें |
| Available Cash | उपलब्ध नकदी |
| Customer Outstanding | ग्राहकों से लेना बाकी |
| Supplier Dues | सप्लायर को देना है |
| What-if Scenario | क्या होगा अगर? |

## 3.7 Status language

Use the same words everywhere:
- **प्राप्त** — money received.
- **बाकी** — remaining amount.
- **बकाया** — outstanding amount.
- **आज देय** — due today.
- **जल्द देय** — due soon.
- **देर से** — overdue.
- **भुगतान हो गया** — fully paid.
- **आंशिक भुगतान** — partially paid.
- **अनुमानित** — forecast/expected.
- **संभावित कमी** — projected shortage.

Never use a status label without defining its rule in the product logic.

---

# PART 4 — INFORMATION ARCHITECTURE AND NAVIGATION

## 4.1 Main navigation

Recommended primary navigation:
1. **मुख्य पृष्ठ** — dashboard.
2. **ग्राहक** — customer credit and collections.
3. **सप्लायर** — supplier bills and payments.
4. **खर्च** — expenses.
5. **नकदी अनुमान** — forecast and Cash Survival Radar.

Place **कार्रवाई** (Action Centre) prominently on the dashboard and optionally as a navigation item if space allows.

## 4.2 Global actions

Keep the four frequent actions easy to reach:
- नया उधार जोड़ें
- भुगतान दर्ज करें
- सप्लायर बिल जोड़ें
- खर्च जोड़ें

On mobile, use a clear “+ जोड़ें” action that opens a small action sheet with these four choices. Do not make the user navigate through multiple pages just to record a common event.

## 4.3 Navigation rules

- Preserve context when returning from a detail screen to a list.
- Keep filters/search when practical.
- Show the current section clearly.
- Avoid more than two levels of navigation for core tasks.
- Provide a visible back action on mobile detail and form screens.
- Prevent accidental loss of unsaved form data.

---

# PART 5 — DASHBOARD: COMPLETE BLUEPRINT

## 5.1 Dashboard purpose

The dashboard is the shopkeeper's daily control centre. Within a few seconds, it should answer:

1. मेरे पास अभी कितना पैसा है?
2. ग्राहकों से कितना लेना बाकी है?
3. किससे और कितना लेना है?
4. सप्लायर को कितना देना है?
5. अगले 7 दिनों में कौन-से भुगतान आने वाले हैं?
6. आगे नकदी कम पड़ने का खतरा है या नहीं?
7. आज मुझे सबसे पहले क्या करना चाहिए?

The dashboard is not a report page. It is a decision page.

## 5.2 Recommended layout order

### A. Header

Display:
- Shop name.
- Greeting or neutral welcome.
- Current date.
- Small profile/settings action.
- Optional sync/save status if the platform has asynchronous persistence.

Do not waste vertical space with a large decorative hero banner.

### B. Primary cash card — “अभी उपलब्ध नकदी”

This is the most important metric.

Display:
- Available cash total.
- Optional breakdown: cash in hand and bank/UPI business balance.
- Small note: “यह दर्ज किए गए वास्तविक लेन-देन पर आधारित है”.
- Last updated time if meaningful.

Definition:
`Available cash = opening cash + opening bank balance + actual cash/bank inflows - actual cash/bank outflows`

Important:
- Credit sales are not cash received.
- Unpaid supplier bills are not cash already paid.
- Do not add expected collections to this actual cash number.

### C. Four key metric cards

Recommended cards:
1. **ग्राहकों से लेना बाकी** — total customer outstanding.
2. **देर से भुगतान** — overdue customer outstanding.
3. **सप्लायर को देना है** — supplier outstanding.
4. **अगले 7 दिनों के खर्च/भुगतान** — upcoming obligations due within the next seven days.

Each card should:
- Show one prominent INR value.
- Show a short explanatory label.
- Show a small comparison or count only if useful.
- Be tappable to open the relevant filtered list.
- Have an empty/zero state that is informative, not alarming.

### D. Cash Survival Radar — “आगे नकदी का हाल”

This is the signature dashboard section.

Show:
- A simple cash projection line/area chart or daily/weekly balance plot.
- Period selector: 30 दिन / 60 दिन / 90 दिन.
- Lowest projected balance.
- Date of lowest projected balance.
- Potential shortage amount, if projected balance falls below the configured safety threshold.
- A label explaining that it is an estimate based on entered due dates and expected collections.

The chart should not imply precision that the data does not support. If dates are uncertain, show a range or a confidence/quality note rather than false certainty.

### E. “आज क्या करना है?” — priority action list

Show no more than the top 3–5 actions on the dashboard, ordered by urgency and financial impact.

Examples:
- “रवि जी का ₹2,400 भुगतान 18 दिन से बाकी है — रिमाइंडर भेजने के लिए संदेश देखें.”
- “ABC Distributors का ₹12,000 बिल 3 दिन में देय है.”
- “अगले सप्ताह अनुमानित नकदी में ₹X की कमी हो सकती है — संभावित कारण देखें.”

Each action includes:
- Short title.
- Person/vendor if relevant.
- Amount.
- Due/overdue date.
- Why it matters.
- One direct action.

Avoid generic “Something needs attention” alerts.

### F. Upcoming schedule

A short chronological list for the next seven days:
- Expected customer collections.
- Supplier bill due dates.
- Expense due dates.

Visually distinguish incoming and outgoing amounts. Do not merge them into one unexplained number.

### G. Recent activity

Show the latest 5–10 meaningful events:
- Credit added.
- Payment received.
- Supplier bill added.
- Supplier payment made.
- Expense recorded.

Each event shows date, description, amount and type. Tapping opens its source record.

## 5.3 Dashboard interactions

| Dashboard item | Tap action |
|---|---|
| Available cash | Open cash breakdown and recent cash movements |
| Customer outstanding | Open customers sorted by highest outstanding |
| Overdue amount | Open overdue-only customer list |
| Supplier dues | Open supplier bills sorted by due date |
| Upcoming obligations | Open upcoming schedule |
| Forecast chart | Open full forecast |
| Risk warning | Open Cash Survival Radar with relevant date selected |
| Action item | Open the exact customer, bill or expense |
| Recent activity | Open the source transaction |

## 5.4 Dashboard calculation contract

The UI must not calculate financial totals independently in multiple places. Use one business-logic source for each metric.

- Customer outstanding: sum of credit transactions minus linked customer payments.
- Overdue customer outstanding: outstanding amounts whose expected payment date has passed.
- Supplier outstanding: sum of supplier bills minus linked supplier payments.
- Upcoming obligations: unpaid supplier bills and unpaid expenses due within the selected time window.
- Available cash: opening balances plus actual receipts minus actual payments.
- Forecast: starting available cash plus forecast inflows minus forecast outflows.

## 5.5 Dashboard empty states

If no records exist:
- Explain what the dashboard will show once records are added.
- Offer a primary action such as “पहला ग्राहक जोड़ें” or “पहला उधार दर्ज करें”.
- Do not display fake zero-risk statements.
- If demo data is available, clearly mark it as sample data and require a deliberate choice before loading it.

## 5.6 Dashboard loading and error states

- Use skeleton placeholders that resemble the final layout.
- Do not show ₹0 while data is still loading if that could be mistaken for a real balance.
- If one widget fails, keep other working widgets visible.
- Show a retry action for failed data.
- Display the last successfully loaded timestamp if stale data may be shown.
- Never silently replace a failed calculation with zero.

---

# PART 6 — FEATURE SPECIFICATIONS

## 6.1 Shop setup and opening balances

**Purpose:** Establish the initial business context and opening cash position.

### Fields
- Shop name (required).
- Owner name (optional or required based on product decision).
- Opening cash balance (required; may be zero).
- Opening bank/UPI business balance (optional; default zero).
- Currency: INR, fixed for MVP.
- Interface language: English or Hindi, selected by the user.

### Behaviour
- Validate amounts as non-negative.
- Explain that opening balance is the money available at the time the shop starts using the app.
- Do not treat existing customer credit as opening cash.
- Do not treat unpaid supplier bills as cash already spent.
- Allow the owner to review setup values before completing.

### UX recommendation
Use a short setup wizard, not a long accounting questionnaire. Explain unfamiliar terms in plain Hindi.

## 6.2 Customer management

**Purpose:** Keep a reliable record of people who buy on credit.

### Customer list
Show:
- Customer name.
- Total outstanding.
- Oldest unpaid date or age.
- Status: clear / partial / overdue.
- Optional phone indicator if a number exists.

### Actions
- Add customer.
- Search by name.
- Open customer detail.
- Edit permitted contact details.
- Add credit sale.
- Record payment.
- Draft reminder.

### Customer detail
Sections:
1. Customer identity.
2. Outstanding summary.
3. Unpaid credit transactions.
4. Payment history.
5. Activity timeline.

### Validation
- Name required.
- Phone optional; validate format only if entered.
- Prevent accidental duplicate customer creation where practical, but do not automatically merge records based only on similar names.

## 6.3 Credit sale / udhaar entry

**Purpose:** Record goods provided now with payment expected later.

### Form fields
- Customer (required).
- Amount (required).
- Sale/transaction date (required; defaults to today).
- Expected payment date (required for forecast; allow a clearly labelled “date not known” path only if the product can handle uncertain collections).
- Description (optional).

### Save behaviour
1. Validate customer and amount.
2. Confirm the entry summary.
3. Save a credit transaction.
4. Increase customer outstanding.
5. Add the expected collection to forecast inputs, not actual cash.
6. Refresh dashboard and customer detail.
7. Show success confirmation.

### Critical rule
A credit sale does not increase available cash. It increases receivables and may create an expected future inflow.

## 6.4 Customer payment recording

**Purpose:** Record full or partial money received from a customer.

### Form fields
- Customer.
- Outstanding credit transaction.
- Current outstanding amount (read-only).
- Payment amount.
- Payment date.
- Payment method: cash / UPI / bank.
- Optional note/reference.

### Behaviour
- Support partial and full payments.
- Show remaining balance before and after entry.
- Prevent payment greater than remaining outstanding.
- Prevent repeated submission from creating duplicate payment records.
- Update actual cash/bank inflows according to the selected payment method.
- Update customer outstanding.
- Recalculate forecast and alerts.

### Example
Original credit ₹2,400; payment received ₹1,000; remaining ₹1,400.

### UX safeguard
Before saving, show: “₹1,000 प्राप्त होंगे; इस उधार पर ₹1,400 बाकी रहेंगे.” Make the confirmation easy to understand.

## 6.5 Supplier management

**Purpose:** Keep track of wholesalers and distributors the shop owes money to.

### Supplier list
Show:
- Supplier name.
- Outstanding total.
- Nearest due date.
- Overdue status if applicable.

### Supplier detail
Show:
- Supplier information.
- Bills.
- Payments.
- Outstanding balance.
- Activity history.

### Fields
- Supplier name (required).
- Phone (optional).
- Notes (optional).

## 6.6 Supplier bills and payments

**Purpose:** Track goods or services purchased on credit and the money still payable.

### Supplier bill fields
- Supplier.
- Bill amount.
- Bill date.
- Due date.
- Description/reference.

### Supplier payment fields
- Supplier bill.
- Amount paid.
- Payment date.
- Method: cash / UPI / bank.
- Optional note/reference.

### Rules
- Allow partial payments.
- Prevent payment greater than bill outstanding.
- Mark bill as paid only when remaining amount is zero.
- Include unpaid balance in future outflows on the due date.
- A supplier payment is the settlement of an existing bill; do not record it again as a separate expense.

### Double-counting prevention
If a supplier bill is ₹12,000 and the shop pays ₹5,000, the system should show ₹7,000 remaining. It must not also create a second ₹5,000 expense record unless the product explicitly models a separate accounting classification without duplicating cash outflow.

## 6.7 Expense management

**Purpose:** Record operating costs that are not already represented by supplier bills.

### Initial categories
- किराया
- बिजली
- वेतन
- परिवहन
- अन्य खर्च

### Fields
- Category.
- Amount.
- Expense date.
- Due date if unpaid.
- Payment status: paid / unpaid.
- Payment date if paid.
- Payment method if paid.
- Description.

### Rules
- Paid expense: affects actual cash outflow on payment date.
- Unpaid expense: affects forecast outflow on due date, not actual cash.
- If an expense is paid later, move it from future obligation to actual outflow.
- Do not enter the same obligation both as a supplier bill and an expense.

## 6.8 Cash position and cash movement

**Purpose:** Show what money is actually available, separate from amounts expected in future.

### Opening balances
- Cash in hand.
- Business bank/UPI balance, optional.

### Actual inflows
- Customer payments received.
- Other actual income explicitly recorded, if included in MVP.

### Actual outflows
- Supplier payments.
- Paid expenses.
- Other actual outflows explicitly recorded, if included in MVP.

### Formula
`Available balance = opening balances + actual inflows - actual outflows`

### Important modelling recommendation
Treat payment method as part of the cash movement. Cash, bank and UPI can be shown separately if the application records them reliably. If the MVP only supports a combined available balance, state that it is a combined business balance and do not imply bank reconciliation.

## 6.9 Cash-flow forecast

**Purpose:** Estimate how recorded expected collections and obligations may affect future cash.

### Periods
- 30 days.
- 60 days.
- 90 days.

### Inputs
- Starting available cash.
- Remaining unpaid customer credit and expected dates.
- Remaining supplier bills and due dates.
- Unpaid expenses and due dates.
- Other explicitly recorded expected inflows/outflows, if supported.

### Output
- Projected balance by day or week.
- Expected inflows.
- Scheduled outflows.
- Lowest projected balance.
- Date of lowest balance.
- Potential shortfall.
- Explanation of included assumptions.

### Forecast categories
1. **Actual:** already received or paid.
2. **Expected:** customer payments that are not yet received.
3. **Scheduled:** bills/expenses with a due date.
4. **Overdue/uncertain:** expected dates already passed or not reliable.

### Recommended forecast method
Use a deterministic date-based cash-flow ledger:
1. Start with current available balance.
2. For each future date, add expected customer collections scheduled for that date.
3. Subtract unpaid supplier bills due on that date.
4. Subtract unpaid expenses due on that date.
5. Carry the closing balance to the next date.
6. Aggregate daily values into weekly chart points if daily detail is too dense.

### Uncertainty handling
A due date is not proof that a customer will pay on that date. Label collections as expected. Consider a conservative view that excludes overdue/uncertain collections from the base case, with a separate “if all expected payments arrive” view if time permits.

### Explainability panel
“यह अनुमान इन बातों पर आधारित है”:
- Current available balance.
- Customer payments expected during the period.
- Supplier bills due.
- Expenses due.
- Overdue amounts excluded or treated conservatively.
- Last updated date.

Do not use an AI model to calculate the numbers.

## 6.10 Cash Survival Radar

**Purpose:** Turn the forecast into a clear warning and action.

### Display
- Current available cash.
- Lowest projected balance.
- Date of lowest projected balance.
- Upcoming obligations around that date.
- Expected collections relied upon.
- Shortfall amount if projected cash falls below zero or a user-defined minimum buffer.

### Suggested risk states
- **सामान्य:** no projected shortage in the selected period.
- **ध्यान दें:** projected balance approaches a low buffer.
- **संभावित कमी:** projected balance falls below zero or the configured safety threshold.

The threshold must be defined and explained. Do not invent a “safe” buffer for every shop.

### Recommended next actions
- Follow up with the highest-impact overdue customer.
- Review whether an upcoming supplier payment can be discussed or rescheduled.
- Review discretionary expenses.
- Check the due date and amount for the affected obligation.

These are prompts for the shopkeeper, not financial guarantees or instructions to default on obligations.

## 6.11 What-if simulator

**Mandatory scenario:** What if a key customer pays 15 days late?

### Inputs
- Select an unpaid credit transaction.
- Delay amount: 15 days (preconfigured for the primary demo).
- Optional scenario label.

### Processing
1. Read the original forecast.
2. Move only the selected expected collection date by 15 days in a temporary scenario calculation.
3. Recalculate daily/weekly projected balance.
4. Compare original and scenario results.
5. Identify any newly created shortage or worsened low point.
6. List affected supplier bills/expenses around the shortage date.

### Outputs
- Original lowest projected balance and date.
- Revised lowest projected balance and date.
- Difference between scenarios.
- Any new potential shortage.
- Obligations affected.
- Suggested follow-up action.

### Isolation
The simulation must not modify the actual credit transaction, payment record, customer balance or saved forecast inputs. Provide “Reset scenario” and “Return to actual forecast”.

## 6.12 Action Centre

**Purpose:** Turn records and calculations into a prioritised to-do list.

### Alert types
- Customer payment overdue.
- Customer expected payment not received.
- Supplier bill due soon.
- Supplier bill overdue.
- Expense due soon.
- Projected cash shortage.
- Forecast data incomplete or stale.

### Alert structure
Every alert should contain:
- What happened.
- Who/what it relates to.
- Amount.
- Due date or age.
- Why it matters.
- One recommended next action.
- Link to the source record.

### Priority framework
Use transparent rules, not opaque AI ranking. A practical order:
1. Projected shortage with a near-term date.
2. Large overdue receivable that could reduce the shortage.
3. Supplier/expense obligation due soon.
4. Other overdue receivables.
5. Lower-urgency reminders.

Do not rank only by largest amount. Timing and impact on upcoming commitments matter.

### Alert lifecycle
- New.
- Reviewed.
- Action taken (optional note).
- Resolved automatically when the underlying condition no longer exists.

Marking an alert reviewed must not change the financial record.

## 6.13 Hindi payment reminder drafts

**Purpose:** Reduce the effort of following up politely.

### Example
“नमस्ते रवि जी, आपके ₹2,400 के बकाया भुगतान के संबंध में विनम्र अनुरोध है। कृपया सुविधा अनुसार भुगतान कर दें। धन्यवाद।”

### Requirements
- Use customer name if available.
- Use the current outstanding amount, not the original credit amount.
- Avoid threatening language.
- Allow the user to review and edit.
- Provide copy action.
- Do not send automatically.
- Do not claim that a message was sent.

Actual WhatsApp delivery is outside the MVP.

---

# PART 7 — SCREEN-BY-SCREEN SPECIFICATION

## Screen 1: Welcome and shop setup
**Goal:** Configure the minimum information needed to start.

Layout:
- Product mark/name.
- Short value statement.
- Shop name field.
- Owner name field.
- Opening cash field.
- Optional bank/UPI balance field.
- Visible English/Hindi language selector.
- Continue button.

States:
- Initial.
- Validation error.
- Saving.
- Setup complete.

## Screen 2: Dashboard
Use the complete dashboard blueprint in Part 5. Keep the first viewport focused on available cash, key outstanding figures and the highest-priority action.

## Screen 3: Customer list
Layout:
- Page title and “ग्राहक जोड़ें”.
- Search.
- Optional filters: सभी / बकाया / देर से.
- Sort options: highest outstanding / oldest due / name.
- Customer rows/cards.

Each row:
- Name.
- Outstanding amount.
- Due status.
- Oldest unpaid date/age.

Mobile: use cards or compact rows, not a wide desktop table.

## Screen 4: Customer details
Layout:
- Customer name and optional contact.
- Outstanding total.
- Add credit / record payment / reminder actions.
- Unpaid transactions.
- Payment history.
- Timeline.

Keep the current balance visible while scrolling where practical.

## Screen 5: Add credit sale
Use a short form. Customer, amount, date and expected payment date should be clearly grouped. Description is optional. Show a review summary before saving.

## Screen 6: Record customer payment
Show the selected transaction and outstanding balance before the amount field. Show remaining balance dynamically as the user enters a valid amount. Confirm before save.

## Screen 7: Supplier list and details
Supplier list should emphasise total payable and next due date. Supplier detail should group bills and payments chronologically.

## Screen 8: Add supplier bill
Fields: supplier, amount, bill date, due date, description/reference. Clearly label that the bill is unpaid until a payment is recorded.

## Screen 9: Expense management
Use category filters and paid/unpaid status. Show upcoming unpaid expenses separately from paid history. Make “Add expense” prominent.

## Screen 10: Cash forecast
Layout:
1. Period selector (30/60/90 days).
2. Projected balance headline.
3. Lowest balance and date.
4. Cash-flow chart.
5. Inflow/outflow summary.
6. Upcoming dated events.
7. Assumptions and uncertainty.
8. Link to Cash Survival Radar.

Chart requirements:
- Clearly label INR values.
- Include a zero line.
- Use a legend for expected inflow and scheduled outflow where appropriate.
- Provide a text summary so the chart is not the only way to understand the result.
- Avoid misleading truncated axes.

## Screen 11: What-if simulator
Layout:
- Scenario title.
- Select customer transaction.
- Delay selector (15 days default).
- Run simulation.
- Original vs revised comparison.
- Changed low point.
- Affected obligations.
- Reset scenario.

Clearly label scenario values as simulated, not actual.

## Screen 12: Action Centre
Layout:
- Priority summary.
- Filter: all / collections / supplier / expenses / cash risk.
- Prioritised alert cards.
- Direct action per card.
- Reviewed state.

---

# PART 8 — DATA MODEL AND ARCHITECTURE

## 8.1 Architecture principles

- Use a relational data model if supported.
- Keep UI separate from business calculations.
- Centralise financial rules in a calculation/service layer.
- Persist records; do not rely on temporary UI state for financial truth.
- Scope every business record to its shop.
- Use atomic operations for payment recording where supported.
- Preserve history and avoid destructive edits.
- Keep the MVP architecture small enough to finish and test.

## 8.2 Core entities

### Shop
- id
- shop_name
- owner_name
- opening_cash_balance
- opening_bank_balance
- currency
- created_at
- updated_at

### Customer
- id
- shop_id
- name
- phone_number (nullable)
- notes (nullable)
- created_at
- updated_at

### Supplier
- id
- shop_id
- name
- phone_number (nullable)
- notes (nullable)
- created_at
- updated_at

### CreditTransaction
- id
- shop_id
- customer_id
- amount
- transaction_date
- expected_payment_date
- description
- status (derived where possible)
- created_at
- updated_at

### CustomerPayment
- id
- shop_id
- customer_id
- credit_transaction_id
- amount
- payment_date
- payment_method
- created_at
- idempotency/reference key if supported

### SupplierBill
- id
- shop_id
- supplier_id
- amount
- bill_date
- due_date
- description
- status (derived where possible)
- created_at
- updated_at

### SupplierPayment
- id
- shop_id
- supplier_id
- supplier_bill_id
- amount
- payment_date
- payment_method
- created_at
- idempotency/reference key if supported

### Expense
- id
- shop_id
- category
- amount
- expense_date
- due_date
- status
- payment_date (nullable)
- payment_method (nullable)
- description
- created_at
- updated_at

### Scenario
- id
- shop_id
- scenario_type
- reference_transaction_id
- delay_days
- created_at

### Optional CashMovement / Audit record
If the platform supports it without creating excessive complexity, maintain a cash-movement/audit record for actual receipts and payments. It should reference its source transaction so that the same payment is never counted twice.

## 8.3 Data integrity rules

- Use integer paise or a decimal-safe monetary type; do not use binary floating-point for stored money.
- Validate amounts as positive and within supported limits.
- Every child record must belong to the same shop as its referenced customer/supplier.
- Payment must not exceed the remaining amount.
- Prevent duplicate submissions.
- Prefer derived outstanding balances over independently editable balance fields.
- Store dates consistently and display them in the user's local format.
- Record created/updated timestamps.
- Do not delete paid financial history casually; use correction/reversal records if supported.

## 8.4 Application layers

1. **Presentation:** Hindi responsive screens and reusable components.
2. **Application/workflow:** create customer, record credit, record payment, add bill, add expense.
3. **Domain/business logic:** balances, cash position, forecast, scenario, alert rules.
4. **Persistence:** relational records and shop-level isolation.
5. **AI assistance:** optional reminder drafting and plain-language explanation of already-calculated values.

## 8.5 AI boundary

AI may:
- Draft a reminder from verified customer and balance fields.
- Explain a calculated warning using supplied calculation facts.
- Summarise already-calculated outstanding information.

AI must not:
- Calculate authoritative balances.
- Invent payment dates or transactions.
- Modify financial records autonomously.
- Convert expected collections into actual cash.
- Promise that a customer will pay.
- Present a forecast as guaranteed.

---

# PART 9 — FINANCIAL RULES AND EXAMPLE CALCULATIONS

## 9.1 Customer outstanding

`Customer outstanding = sum(credit sales) - sum(customer payments)`

Example: ₹2,400 credit - ₹1,000 received = ₹1,400 outstanding.

## 9.2 Supplier outstanding

`Supplier outstanding = sum(supplier bills) - sum(supplier payments)`

Example: ₹12,000 bill - ₹5,000 paid = ₹7,000 outstanding.

## 9.3 Actual available cash

`Available cash = opening balances + actual inflows - actual outflows`

Only money actually received or paid belongs in this calculation.

## 9.4 Forecast balance

For each forecast date:

`Closing projected cash = previous projected cash + expected inflows - scheduled outflows`

The next date starts with the previous date's closing projected cash.

## 9.5 Avoiding double-counting

- A customer payment is both a reduction in receivable and an actual cash inflow; count it once in cash.
- A supplier payment is both a reduction in payable and an actual cash outflow; count it once in cash.
- A supplier bill is a future obligation until paid; do not count it as an actual outflow when created.
- An unpaid expense is a future obligation; do not count it as actual cash outflow until paid.
- Do not record a supplier payment as a second expense.
- When an expected collection becomes an actual payment, remove it from expected inflows and include it as actual inflow.

## 9.6 Forecast uncertainty

A forecast is only as reliable as the dates and amounts entered. Show:
- Number/value of expected collections included.
- Number/value of overdue collections.
- Bills and expenses included.
- Missing or unknown dates.
- Last updated time.

Do not silently assume all overdue customers will pay.

---

# PART 10 — DEMO DATA AND THREE-MINUTE STORY

Use fictional data only.

**Shop:** श्री लक्ष्मी जनरल स्टोर्स  
**Opening available cash:** ₹28,500

Sample customers:
- Ravi: ₹2,400 outstanding.
- Suresh: ₹1,200 outstanding.
- Lakshmi: ₹800 outstanding.

Sample supplier bills:
- ABC Distributors: ₹12,000 due in 3 days.
- Krishna Wholesale: ₹5,000 due in 7 days.

Sample expenses:
- Rent: ₹8,000.
- Electricity: ₹1,500.
- Other operating expense: ₹2,500.

These are illustrative sample values, not actual business records or a validated financial forecast. Set exact due dates and paid/unpaid statuses in the demo dataset so the resulting forecast is internally consistent.

## Demo narrative

1. Introduce the shopkeeper's everyday problem: udhaar is in a notebook and bills are remembered mentally.
2. Open the dashboard: show available cash and who owes money.
3. Open Ravi's record and show the outstanding balance.
4. Add a new credit sale.
5. Record a partial payment and show the remaining amount.
6. Show the supplier bills and upcoming expenses.
7. Open the 30/60/90-day forecast and explain its assumptions.
8. Simulate Ravi paying 15 days late.
9. Show how the lowest projected cash point changes and which obligation is affected.
10. Open the Action Centre and show the recommended next action.

**Closing message:** “DukaanSaathi सिर्फ हिसाब नहीं रखता — यह दुकान के मालिक को पहले से दिखाता है कि आगे नकदी पर क्या असर पड़ सकता है।”

---

# PART 11 — BUSINESS MODEL HYPOTHESES

These are hypotheses, not validated market prices.

| Plan | Hypothesis price | Possible scope |
|---|---:|---|
| Free | ₹0 | Basic customer credit ledger |
| Starter | ₹99/month | Payment tracking and expenses |
| Plus | ₹199/month | Forecast, scenario simulation and advanced alerts |

Before claiming willingness to pay:
- Interview actual kirana shopkeepers.
- Observe how they currently record udhaar.
- Ask how often they forget follow-ups.
- Ask how they currently plan supplier payments.
- Test whether forecast warnings change decisions.
- Test whether they would pay, and what they would stop using.
- Compare the effort required to enter records against the value received.

Potential distribution hypotheses:
- Local accountants/bookkeepers.
- Wholesalers and distributors.
- Shopkeeper associations.
- Local retail communities.

Do not build distribution integrations during the MVP.

---

# PART 12 — ENGINEERING QUALITY, TESTING AND CHANGE MANAGEMENT

## 12.1 Code quality

- Use consistent, descriptive names.
- Keep functions focused.
- Avoid duplicated financial logic.
- Separate presentation from domain calculations.
- Reuse components where behaviour is genuinely shared.
- Validate at both UI and business-logic boundaries where supported.
- Handle errors explicitly.
- Avoid unnecessary abstractions that slow down delivery.

## 12.2 Documentation and docstrings

Add docstrings to important business functions, services and non-obvious workflows. A useful docstring should explain:
- What the function does.
- Important inputs and outputs.
- Business assumptions.
- Side effects, if any.
- Important validation or edge cases.

Comment why a non-obvious decision exists, not what an obvious line of code already says.

Document:
- Forecast assumptions.
- Payment allocation rules.
- Cash movement rules.
- Scenario isolation.
- Alert priority rules.
- Any known limitations.

## 12.3 Testing matrix

### Customer credit
- Create a credit transaction.
- Verify outstanding increases.
- Verify it does not increase actual cash.
- Verify expected collection appears in forecast.

### Customer payments
- Full payment.
- Partial payment.
- Payment equal to remaining balance.
- Payment greater than remaining balance (must reject).
- Duplicate submit (must not duplicate).
- Payment date and method reflected correctly.

### Supplier bills
- Create bill.
- Verify payable increases.
- Verify actual cash does not decrease on bill creation.
- Partial and full supplier payment.
- Verify payable and cash movement update correctly.

### Expenses
- Unpaid expense appears in future obligations.
- Paid expense reduces actual cash once.
- Changing unpaid to paid removes future obligation and adds actual outflow once.

### Forecast
- Expected inflow on the correct date.
- Supplier payment on due date.
- Expense on due date.
- Actual payment not counted again as expected.
- 30/60/90 period boundaries correct.
- Negative or low projected balance warning correct.

### Scenario
- Selected collection moves by 15 days only in simulation.
- Actual records remain unchanged.
- Original forecast can be restored.
- Comparison values match independently calculated test cases.

### UX and reliability
- Empty states.
- Loading states.
- Error states.
- Small-screen layout.
- Long Hindi names.
- Large currency values.
- Slow network or failed save where testable.
- Navigation/back behaviour.

## 12.4 Change-management workflow

Before changing an existing feature or fixing a bug:
1. Understand the reported issue and expected behaviour.
2. Inspect the existing screen, workflow and relevant business rules.
3. Reproduce the issue if possible.
4. Identify the root cause.
5. Check related features and possible side effects.
6. Propose the smallest safe change.
7. Implement within the permitted Codebenders workflow.
8. Test the affected flow and nearby regression cases.
9. Update documentation if the rule or behaviour changed.
10. Record the iteration for the hackathon submission.

Do not make blind edits to financial logic.

---

# PART 13 — BUILD ROADMAP AND PRIORITIES

## Phase 1: Foundation
- Create project in Codebenders.
- Confirm supported stack and persistence.
- Establish app shell and navigation.
- Configure Bilingual English/Hindi layout.
- Implement shop setup.
- Establish reusable design components.

## Phase 2: Core records
- Customers.
- Credit transactions.
- Customer payments.
- Suppliers.
- Supplier bills.
- Supplier payments.
- Expenses.

## Phase 3: Financial engine
- Customer outstanding.
- Supplier outstanding.
- Actual available cash.
- Upcoming obligations.
- Validation and duplicate prevention.
- Cash movement consistency.

## Phase 4: Forecast and simulation
- 30/60/90-day forecast.
- Daily/weekly projection.
- Cash Survival Radar.
- 15-day delayed-payment scenario.
- Original/revised comparison.
- Action Centre rules.

## Phase 5: UX and reliability
- Dashboard polish.
- Reminder drafts.
- Search and filters.
- Loading/error/empty states.
- Responsive checks.
- Sample data consistency.

## Phase 6: Verification and submission
- End-to-end tests.
- Financial test cases.
- Mobile and desktop review.
- Deployment.
- Public link verification.
- Demo rehearsal.
- Codebenders prompts and iteration record.
- Final rule/licensing check.

### Priority levels

**P0 — Must work**
- Shop setup.
- Customer and supplier records.
- Credit sales and customer payments.
- Supplier bills and payments.
- Expenses.
- Dashboard.
- Actual cash position.
- 30/60/90 forecast.
- 15-day delay simulation.
- Actionable alerts.

**P1 — Strongly desirable**
- Hindi reminder drafts.
- Search and filters.
- Forecast explanation.
- Polished responsive design.
- Robust empty/loading/error states.

**P2 — Exclude from hackathon MVP**
- Voice transaction entry.
- Receipt OCR/scanning.
- Bank statement import.
- WhatsApp API delivery.
- Inventory management.
- Multi-user permissions.
- Multi-shop management.
- GST/accounting suite.

If time is limited, finish P0 workflows and test them before starting P1.

---

# PART 14 — HACKATHON COMPLIANCE, DATA AND LICENSING

## 14.1 Rules to follow

Based on the participant rules provided for this event:
- Select one official problem statement.
- Codebenders is mandatory for development.
- Build from scratch.
- Do not use prohibited external AI coding tools or equivalent tools.
- Do not use pre-existing code or ready-made projects where prohibited.
- Be prepared to demonstrate Codebenders usage and the development process.
- Submission requires a working deployed application link, Codebenders usage details, key prompts and development iterations.
- Screenshots alone are insufficient.
- Ensure all links work.
- Submit on time.
- Follow the code of conduct and avoid plagiarism or manipulation.

If uncertain whether external planning/specification assistance is allowed, ask the organisers. Do not assume that a planning document grants permission to use prohibited tools during implementation.

## 14.2 Synthetic data and privacy

Use fictional demo records only:
- No real customer names linked to real financial details.
- No real phone numbers.
- No real bank credentials.
- No confidential shop records.
- No unauthorised datasets.

Collect only information needed for the feature. Phone numbers should remain optional in the MVP.

## 14.3 Responsible product claims

- Forecasts are estimates, not guarantees.
- Expected collections are not confirmed cash.
- The product does not provide regulated financial advice.
- AI explanations must be grounded in calculated facts.
- Users must confirm any transaction before it is saved.

## 14.4 Ownership and licensing

The provided event guidance indicates that code, datasets, images and assets must be legally permitted for use and sharing; third-party components should be disclosed where required; and the applicable participant agreement governs Codebenders' showcase, reuse or modification rights.

Until the organisers provide the final agreement:
- Do not assume submission automatically transfers ownership.
- Do not assume unrestricted participant rights without reviewing the agreement.
- Do not declare the project open source prematurely.
- Do not add an MIT licence file until rights and competition terms are checked.
- Maintain a dependency and asset register.
- Keep required copyright notices and attributions.

### Dependency register

| Item | Source | Licence/permission | Status |
|---|---|---|---|
| Application code | Created during hackathon | Subject to event agreement | Review |
| UI components | Only if permitted | Verify exact licence | Review |
| Icons | Approved source | Verify attribution/redistribution | Review |
| Fonts | Approved source | Verify licence | Review |
| Images | Original or authorised | Verify permission | Review |
| Demo data | Created as synthetic data | Original fictional data | Ready |
| Packages | Official package sources | Review each package licence | Review |

---

# PART 15 — JUDGING STRATEGY

Official judging criteria supplied for the event:

| Criterion | Weight | Product response |
|---|---:|---|
| Working Product | 30% | Complete financial workflows, forecast and scenario |
| Business Viability | 25% | Specific user, recurring pain and testable pricing hypothesis |
| Problem and User Clarity | 20% | Focused kirana shopkeeper persona |
| Build Quality and Use of Codebenders | 15% | Reliable calculations, validation, responsive UI and compliant platform usage |
| Presentation | 10% | Clear story showing the problem, product and changed decision |
| **Total** | **100%** | |

## What judges should remember

The memorable moment should be:
- The shop has money today.
- A supplier bill is due soon.
- The owner expects a customer payment.
- The customer delays payment by 15 days.
- The forecast shows a potential cash gap.
- DukaanSaathi explains which obligation is affected and what the owner can review today.

This is more distinctive than presenting a generic ledger dashboard.

Do not claim that the project is unique in the market or that the pricing is validated unless you have evidence. Present the differentiation as the product hypothesis being demonstrated.

---

# PART 16 — MASTER ACCEPTANCE CHECKLIST

## Product
- [ ] One primary user-facing panel: Shopkeeper Panel.
- [ ] Staff/Cashier access deferred beyond the MVP.
- [ ] No customer, supplier or accountant portal in the MVP.
- [ ] One clearly defined kirana shopkeeper persona.
- [ ] English/Hindi bilingual language and everyday terminology.
- [ ] Standalone application.
- [ ] INR throughout.
- [ ] Manual entry workflows.

## Dashboard
- [ ] Available cash.
- [ ] Customer outstanding.
- [ ] Overdue customer payments.
- [ ] Supplier outstanding.
- [ ] Upcoming expenses and obligations.
- [ ] 30/60/90-day outlook.
- [ ] Lowest projected balance and date.
- [ ] Cash shortage warning when applicable.
- [ ] Prioritised next actions.
- [ ] Recent activity.
- [ ] Clear loading, error and empty states.

## Financial workflows
- [ ] Add/edit/search customers.
- [ ] Add credit sale.
- [ ] Record full and partial customer payment.
- [ ] Add/edit suppliers.
- [ ] Add supplier bill.
- [ ] Record supplier payment.
- [ ] Add paid and unpaid expenses.
- [ ] Prevent overpayment.
- [ ] Prevent duplicate payment.
- [ ] Avoid double-counting.

## Forecast and intelligence
- [ ] Actual and expected money are distinct.
- [ ] Forecast assumptions are visible.
- [ ] 30-day view.
- [ ] 60-day view.
- [ ] 90-day view.
- [ ] Lowest balance identified.
- [ ] 15-day delay simulation.
- [ ] Actual records unchanged by simulation.
- [ ] Alerts link to source records.
- [ ] Reminder drafts use current outstanding values.

## UX and engineering
- [ ] Mobile-first layout.
- [ ] Responsive tablet and desktop layouts.
- [ ] Reusable components.
- [ ] Consistent typography and spacing.
- [ ] Accessible contrast and status labels.
- [ ] Input validation.
- [ ] Meaningful docstrings and business-rule documentation.
- [ ] Financial calculations tested.
- [ ] Error handling and retry behaviour.
- [ ] Shop-level data isolation.

## Compliance and submission
- [ ] Codebenders used as required.
- [ ] No prohibited external AI coding tools.
- [ ] No prohibited pre-existing code.
- [ ] Synthetic demo data only.
- [ ] Third-party assets and dependencies reviewed.
- [ ] Ownership/licensing terms checked.
- [ ] Working deployed URL.
- [ ] URL tested in a fresh browser session.
- [ ] Codebenders usage documented.
- [ ] Key prompts and iterations documented.
- [ ] Live demo rehearsed.
- [ ] Submission completed before deadline.

---

# PART 17 — FINAL PRODUCT DEFINITION

DukaanSaathi is a standalone, English/Hindi bilingual financial operations application for owner-operated Indian kirana shops. It helps shopkeepers record customer credit, collect payments, manage supplier bills, track operating expenses, understand actual available cash and estimate future cash position over 30–90 days.

Its signature capability, the **Cash Survival Radar**, identifies possible future cash pressure, explains the records behind the warning and lets the owner test how a delayed customer payment could affect upcoming obligations.

**Core promise:** दुकान का पैसा कहाँ आ रहा है, कहाँ जा रहा है और आगे कितना बचेगा — अब सब एक जगह।

**Final product principle:** Build a reliable financial workflow first. Make the forecast transparent. Make every warning actionable. Add AI only where it reduces effort without compromising financial accuracy.

**DukaanSaathi — More than a digital ledger. A financial companion for the neighbourhood shopkeeper.**


---

# PART 18 — SYSTEM DESIGN, SECURITY AND PRODUCTION-QUALITY ENGINEERING

## 18.1 Non-negotiable engineering principle

DukaanSaathi handles financial records. Even though the hackathon MVP uses synthetic data, the architecture should follow professional software engineering practices from the beginning.

The MVP should be simple, but not careless:
- Simple architecture, clear boundaries.
- Secure by default.
- Financial calculations centralised and testable.
- Data access controlled on the server/database side.
- No secrets in frontend code or source control.
- Every important financial operation validated.
- Errors handled without exposing internal details.
- A design that can evolve without requiring a complete rewrite.

Do not build microservices, Kubernetes infrastructure or complex event streaming for this solo hackathon MVP. They add operational complexity without solving a current requirement.

## 18.2 Recommended system architecture: modular monolith

Use a **modular monolith**: one deployable application organised into clear functional modules. This is more appropriate than microservices for a solo developer, a short hackathon and a small initial user base.

Conceptual architecture:

```text
Shopkeeper (English / Hindi)
          |
          v
Responsive Web Application
          |
          v
Authentication + Application/API Boundary
          |
          v
Application Services
  |       |       |        |
  v       v       v        v
Customer Supplier Expense Forecast
Module   Module   Module   Module
  |       |       |        |
  +-------+-------+--------+
          |
          v
Domain / Financial Rules
  - Outstanding calculations
  - Cash position
  - Forecast engine
  - Scenario simulation
  - Alert rules
          |
          v
Persistence / Database
  - Shops
  - Users
  - Customers
  - Suppliers
  - Transactions
  - Payments
  - Expenses
  - Audit events
```

The diagram is conceptual. Implement it using the capabilities and architecture supported by Codebenders. Do not introduce a separate service for every box.

### Layer responsibilities

**1. Presentation layer**
- English/Hindi interface.
- Responsive layouts.
- Forms, tables/cards, charts and notifications.
- Client-side validation for usability.
- No authoritative financial calculations.
- No direct database credentials or privileged secrets.

**2. Authentication and API boundary**
- Verify the signed-in user.
- Determine which shop the user is authorised to access.
- Validate request shape and size.
- Enforce authorisation on every protected operation.
- Apply rate limits to login and sensitive endpoints where supported.

**3. Application/service layer**
- Orchestrates workflows such as creating a credit sale or recording a payment.
- Applies business validation.
- Coordinates database transactions.
- Returns safe, predictable responses.

**4. Domain/business layer**
- Contains the authoritative financial rules.
- Calculates customer and supplier outstanding balances.
- Calculates actual available cash and forecasts.
- Runs what-if scenarios without changing actual records.
- Generates alerts from deterministic rules.

**5. Persistence layer**
- Stores durable records.
- Enforces primary keys, foreign keys, unique constraints and appropriate indexes.
- Uses transactions for related financial writes.
- Restricts records to the authorised shop.

**6. Optional AI assistance**
- Receives only the minimum necessary, already-calculated facts.
- Drafts or explains text.
- Never becomes the source of financial truth.
- Must not receive credentials, secrets or unnecessary personal information.

## 18.3 System design principles to follow

### Separation of concerns
Keep UI rendering, request handling, business rules and database operations separate. A button click should not contain the complete financial calculation and persistence logic.

### Single responsibility
Each module/function should have one clear reason to change. For example, payment validation should not be mixed with chart formatting.

### DRY — Don't Repeat Yourself
Keep financial formulas and status rules in one authoritative place. The dashboard, customer detail and forecast must not implement different versions of the same balance calculation.

### KISS — Keep It Simple
Choose the simplest architecture that safely meets the MVP requirements. Avoid unnecessary agents, queues, services and integrations.

### SOLID where appropriate
Use clear interfaces and small responsibilities where they improve maintainability. Do not force enterprise abstractions into a small application.

### Dependency inversion / replaceable integrations
Business rules should not depend directly on a specific AI vendor, email provider or hosting service. Put optional integrations behind small interfaces/adapters where the chosen platform supports this.

### API contract consistency
For each operation, define:
- Request fields and types.
- Required and optional fields.
- Validation rules.
- Success response.
- Error response.
- Authorisation requirement.

Use consistent status codes and response shapes if the platform exposes HTTP APIs.

### Database normalisation
Keep customers, suppliers, bills, payments and expenses as distinct records with relationships. Avoid storing multiple independently editable copies of the same financial truth.

### ACID transactions
Where supported, record a payment and its corresponding cash movement/audit event atomically. Either all related changes succeed, or none do.

### Idempotency
A repeated submit or network retry must not create a second payment. Use an idempotency key or unique operation reference where supported. Disable the submit button during processing as a UI safeguard, but do not rely on the UI alone.

### Stateless application logic
Do not rely on in-memory server state to preserve financial records or user sessions across deployments. Persist required data and use the platform's supported secure session mechanism.

### Configuration by environment
Keep development and production configuration separate. Never hardcode database URLs, API keys, signing secrets or credentials into source code.

## 18.4 Security model and trust boundaries

Assume that:
- A user can manipulate browser requests.
- Client-side validation can be bypassed.
- A user may attempt to access another shop's records by changing an identifier.
- Network requests can be repeated.
- Input may contain malicious strings.
- A third-party dependency may contain vulnerabilities.
- A forecast or dashboard can be wrong if records are duplicated or manipulated.

The server/database must enforce the rules. Hiding a button in the frontend is not authorisation.

### Authentication
- Require authenticated access to private shop data.
- Use the platform's established authentication provider or secure authentication mechanism if available.
- Prefer secure, HTTP-only, Secure and SameSite cookie-based sessions where supported.
- Use appropriate session expiry and logout behaviour.
- Do not build custom password storage or cryptography for the hackathon.
- If passwords are managed by the application, use a recognised password-hashing algorithm through a trusted library; never store plaintext or reversibly encrypted passwords.
- Protect login and password-reset flows against brute-force attempts where supported.
- Do not reveal whether an arbitrary email/phone number has an account in password-reset responses.

### Authorisation
- The MVP has one primary role: Shopkeeper/Owner.
- Every protected read and write must verify the authenticated user's shop membership.
- Do not trust a `shop_id` supplied by the browser without checking that the user is authorised for it.
- Scope database reads and writes by the authorised shop.
- Staff roles are deferred; if added later, implement server-side role and permission checks.
- Do not create customer or supplier logins for the MVP.

### Shop-level data isolation
Every shop-owned record should carry a `shop_id` or have an enforceable relationship to a shop-owned parent record.

For every operation:
1. Identify the authenticated user.
2. Resolve the shop they are authorised to use.
3. Query/update only records belonging to that shop.
4. Verify that referenced customer, supplier, bill and transaction records belong to the same shop.
5. Reject cross-shop references.

If the chosen database supports Row-Level Security (RLS), use policies based on authenticated identity and shop membership. Test policies directly. RLS is an additional database enforcement layer, not a reason to omit server-side checks.

### Input validation
Validate on the server/business boundary:
- Amount is a valid positive monetary value.
- Amount uses the supported precision and range.
- Dates are valid and within reasonable supported bounds.
- IDs are valid and belong to the current shop.
- Text lengths are limited.
- Enum values such as payment method/category are allow-listed.
- Optional phone numbers are validated if supplied.
- Unknown fields are rejected or safely ignored according to the API contract.

Never trust a value merely because it came from the application's own form.

### Injection and browser security
- Use parameterised database queries or a safe ORM/query builder.
- Never concatenate untrusted input into SQL.
- Escape user-provided text when rendered.
- Avoid rendering arbitrary HTML from customer notes or AI output.
- Use a Content Security Policy where supported.
- Configure appropriate security headers where supported.
- Protect state-changing cookie-authenticated requests against CSRF using the platform's supported protections.
- Avoid unsafe redirects and open redirect patterns.
- Do not store authentication tokens in localStorage if a safer supported session mechanism is available.

### Secrets management
- Store secrets in Codebenders' supported secret/configuration facility or the deployment provider's secret manager.
- Keep `.env` files out of source control.
- Provide only non-sensitive public configuration to the browser.
- Never expose service-role database keys, private API keys, signing secrets or database passwords in frontend bundles.
- Rotate any secret accidentally committed or exposed.
- Use separate credentials for development and production.

### Transport and storage protection
- Use HTTPS for deployed application traffic.
- Use provider-managed encryption at rest where available.
- Restrict database access to the application/service identity.
- Do not expose database administration ports publicly.
- Use least-privilege credentials.
- Avoid collecting bank credentials or sensitive identity documents; they are not needed for this MVP.

### Rate limiting and abuse protection
Where supported:
- Rate-limit login attempts.
- Rate-limit reminder/AI generation endpoints.
- Limit request body sizes.
- Add pagination and sensible maximum page sizes.
- Prevent repeated expensive forecast or AI requests from being triggered without bounds.

### Error handling
- Return safe user-facing errors.
- Do not expose stack traces, SQL statements, secret values or internal infrastructure details.
- Log technical details securely on the server.
- Give users a retry or correction path where appropriate.
- Do not convert calculation failures into a displayed ₹0 balance.

## 18.5 Financial data integrity and concurrency

Financial records need stricter controls than ordinary profile data.

- Store money as integer paise or a decimal-safe numeric type.
- Do not use binary floating-point for authoritative currency calculations.
- Use database constraints for positive amounts and valid relationships where supported.
- Use a database transaction for payment plus related ledger/audit updates.
- Prevent payment amounts from exceeding the outstanding balance at the time of commit.
- Re-check outstanding balance inside the transaction to reduce race conditions.
- Use idempotency keys or unique payment operation IDs to prevent duplicate writes.
- Keep source transactions immutable where practical; use correction/reversal entries rather than silently rewriting financial history.
- Record who performed a financial action and when, if user identity is available.
- Recalculate dashboard/forecast from the authoritative records or a safely maintained derived view.

### Concurrency example
If two payment requests arrive for the same ₹1,000 outstanding balance, each for ₹800, both must not succeed based on the same stale balance. The application must re-check and enforce the remaining amount atomically at the database/service boundary.

## 18.6 Audit trail

Maintain an audit trail for important actions where the platform supports it:
- Customer created/updated.
- Credit transaction created/corrected.
- Customer payment recorded/reversed.
- Supplier bill created/corrected.
- Supplier payment recorded/reversed.
- Expense created/updated/marked paid.
- Shop settings changed.

An audit event should record:
- Actor/user ID.
- Shop ID.
- Action type.
- Entity type and ID.
- Timestamp.
- Minimal before/after metadata where appropriate.

Do not log passwords, tokens, full payment credentials or unnecessary personal data. Audit history is not the same as a user-editable transaction description.

## 18.7 Reliability, backups and recovery

- Use the database provider's backup/export facilities if available.
- Verify whether automatic backups exist on the selected free plan; do not assume they do.
- Export synthetic demo data so the hackathon demonstration can be restored.
- Test a restore/export path if time permits.
- Handle temporary network/database failures gracefully.
- Avoid acknowledging a payment as saved until persistence succeeds.
- Show a clear failure state if the save did not complete.
- Use retries carefully; financial writes must be idempotent.
- Keep a simple recovery procedure documented.

A free tier may not provide point-in-time recovery, automated backups or uptime guarantees. If those are unavailable, document the limitation and keep an independent export of non-sensitive synthetic demo data.

## 18.8 Observability and operational readiness

For the MVP, implement lightweight observability:
- Structured server-side logs where supported.
- Request/error identifiers where supported.
- Record critical workflow failures.
- Monitor deployment/build status.
- Track failed database operations.
- Avoid logging sensitive financial/customer data unnecessarily.
- Provide a basic health check if the platform supports it.

Do not build a full monitoring stack for the hackathon. Ensure that errors can be diagnosed without exposing private data.

## 18.9 Performance and scalability

Optimise for a small shop and a modest initial dataset, while avoiding obvious design problems:
- Paginate customer, supplier and transaction lists.
- Add indexes to commonly filtered fields such as `shop_id`, `customer_id`, `supplier_id`, `due_date` and transaction date.
- Fetch only fields needed by each screen.
- Avoid one database request per row (N+1 query pattern).
- Calculate dashboard metrics efficiently; reuse a single authoritative service/query per metric.
- Avoid loading the entire transaction history on every dashboard refresh.
- Keep charts to daily/weekly aggregates rather than rendering thousands of points.
- Add bounded search and sensible query limits.
- Measure before introducing caching or background jobs.

Do not add Redis, Kafka or microservices unless a demonstrated requirement justifies them.

## 18.10 Privacy and data minimisation

For the hackathon:
- Use synthetic data only.
- Make customer phone numbers optional.
- Do not collect Aadhaar, PAN, bank credentials or medical/identity information.
- Do not send full customer records to an AI service.
- Send only the minimum fields needed to draft a reminder, if AI is used.
- Do not use real customer data in screenshots, logs or demo recordings.
- Provide a clear data-use explanation if the application is later opened to real users.

## 18.11 Security verification checklist

Before deployment, verify:

- [ ] Unauthenticated users cannot open private shop records.
- [ ] A user cannot read another shop's customer by changing an ID.
- [ ] A user cannot create a payment against another shop's bill.
- [ ] Server-side validation rejects invalid amounts and dates.
- [ ] Payment greater than outstanding is rejected at commit time.
- [ ] Duplicate payment requests do not create duplicate records.
- [ ] Database queries are parameterised or safely constructed.
- [ ] User-entered text is safely rendered.
- [ ] Secrets are not present in frontend bundles or source control.
- [ ] HTTPS is enabled for the deployed app.
- [ ] Errors do not expose stack traces or secrets.
- [ ] Sensitive values are not written to logs.
- [ ] Shop-level data isolation is tested.
- [ ] Backup/export limitations are understood.
- [ ] The what-if simulator cannot alter actual records.

---

# PART 19 — FREE / OPEN-SOURCE RESOURCE AND COST POLICY

## 19.1 Cost objective

**Target hackathon infrastructure spend: ₹0**, provided the mandatory Codebenders environment and a suitable deployment/persistence path are available within the participant's included access or free quotas.

This is a target, not a guarantee. Free tiers can change, require payment details, pause inactive projects, limit storage/builds/bandwidth, or charge after a quota is exceeded.

## 19.2 Resource selection order

Use resources in this order:

1. Capabilities included in the mandatory Codebenders environment.
2. Existing free tools and accounts already available to the participant, if permitted by the event rules.
3. Open-source libraries that can run within the permitted environment.
4. External free tiers only when necessary and after checking current limits and event compliance.
5. Paid services only with explicit approval; the MVP should not require them.

Do not sign up for a paid trial that can automatically convert to a subscription without understanding its billing terms.

## 19.3 Resource decision table

| Need | Preferred choice | Cost target | Verification required |
|---|---|---:|---|
| App development | Mandatory Codebenders | Included in event access if provided | Confirm account quota and platform terms |
| UI components | Built-in components or permissively licensed open-source components | ₹0 | Verify licence and permitted use |
| Icons | Built-in icons or an open-source icon set | ₹0 | Verify attribution/licence |
| Fonts | System fonts or appropriately licensed open fonts | ₹0 | Verify redistribution terms |
| Database | Codebenders-provided persistence if suitable | ₹0 target | Confirm storage, limits, backup and access controls |
| Authentication | Built-in platform authentication if available | ₹0 target | Confirm session/security capabilities |
| Hosting/deployment | Included Codebenders deployment if available | ₹0 target | Confirm public deployment and quota |
| Charts | Lightweight open-source chart library or native charts | ₹0 | Verify licence and bundle size |
| AI | Optional; omit unless included free and allowed | ₹0 | Confirm policy, token allowance and data handling |
| Email/WhatsApp | Excluded from MVP | ₹0 | No paid delivery service |
| File storage | Excluded unless essential | ₹0 | No customer documents in MVP |
| Monitoring | Platform logs/basic health checks | ₹0 target | Confirm availability and retention |
| Version control | Permitted Git repository | ₹0 target | Confirm it does not violate event restrictions |

## 19.4 AI cost decision

AI is not required for the core financial engine. The application remains useful without an external LLM.

If Codebenders includes AI tokens or an approved built-in AI capability, use it only for optional reminder drafting or explanation, subject to the event's tool rules. Do not assume that a promotional token allocation is unlimited or that it authorises the use of a prohibited external coding assistant.

Do not make an external AI API a runtime dependency for dashboard, payment, balance or forecast functionality.

## 19.5 Free-tier verification before selection

For every external provider, record:
- Current free quota.
- Whether a credit card is required.
- Whether the service sleeps or pauses.
- Database/storage limits.
- Build/deployment limits.
- Bandwidth/request limits.
- Backup and restore availability.
- Data region and privacy terms.
- What happens when the quota is exceeded.
- Whether the provider permits the intended hackathon/demo use.

Do not rely on old blog posts or remembered free-tier limits. Verify the provider's current official pricing and terms at the time of setup.

## 19.6 No-cost fallback plan

If an external database or hosting free tier is unavailable:
1. First check whether Codebenders provides the required capability.
2. Reduce MVP scope rather than adding paid infrastructure.
3. Use a simple supported persistence option.
4. Keep synthetic seed data reproducible.
5. Never substitute insecure public storage or expose database credentials to avoid cost.

The application must still satisfy the hackathon requirement for a working deployed link. If free deployment is not available through the permitted environment, ask the organisers what deployment options or credits are available before incurring cost.

## 19.7 Cost-control safeguards

- Disable unused external services.
- Avoid paid AI calls in loops or on every dashboard refresh.
- Cache only non-sensitive derived data when useful and safe.
- Set provider usage alerts/budgets where available.
- Do not upload large assets unnecessarily.
- Do not store user-uploaded documents in the MVP.
- Review usage before the final demo.

---

# PART 20 — SYSTEM DESIGN AND SECURITY ACCEPTANCE GATES

The MVP is not ready for demonstration until these gates pass.

### Gate 1: Architecture
- [ ] One deployable modular application.
- [ ] Clear presentation, application, domain and persistence boundaries.
- [ ] No unnecessary microservices.
- [ ] Financial calculations centralised.
- [ ] Data model and API contracts documented.

### Gate 2: Security
- [ ] Authentication enabled for private records.
- [ ] Server-side authorisation on every protected operation.
- [ ] Shop-level data isolation enforced.
- [ ] Server-side input validation.
- [ ] Secrets kept out of source control and frontend.
- [ ] HTTPS enabled.
- [ ] Safe error handling.
- [ ] Database queries safely parameterised.
- [ ] No sensitive demo data.

### Gate 3: Financial integrity
- [ ] Decimal-safe money representation.
- [ ] Database constraints and relationships.
- [ ] Atomic payment writes where supported.
- [ ] Duplicate payment protection.
- [ ] Overpayment prevention at commit time.
- [ ] Audit/correction strategy.
- [ ] Forecast and scenario isolation verified.

### Gate 4: Reliability
- [ ] Save confirmation only after persistence succeeds.
- [ ] Failure and retry behaviour tested.
- [ ] Export/backup limitations documented.
- [ ] Critical errors diagnosable without exposing private data.
- [ ] Public deployment tested in a fresh browser session.

### Gate 5: Cost and compliance
- [ ] Codebenders is used as required.
- [ ] No prohibited external AI coding tools.
- [ ] Every external dependency and asset is licence-checked.
- [ ] Free-tier limits are verified.
- [ ] No unexpected paid service or auto-renewing trial.
- [ ] Deployment path satisfies the submission requirements.

# PART 21 — APPROVED DECISIONS AND FREE-RESOURCE STACK

This part records the product owner's decisions. Where it conflicts with an earlier open question or an earlier "decide later" note in this document, this part governs.

## 21.1 Customer payment allocation

- Default allocation is FIFO: the oldest outstanding credit sale is settled first.
- The shopkeeper may manually select a specific outstanding credit sale instead.
- A payment is never allocated above the remaining outstanding amount of the selected or FIFO-chosen credit sale. Any excess is rejected, not carried over silently.

## 21.2 Supplier payment allocation

- Default allocation is FIFO: the oldest due outstanding supplier bill is settled first.
- The shopkeeper may manually select a specific bill.
- Overpayment of a bill is prevented.

## 21.3 Overdue customer collections

- Overdue collections are excluded from the base-case forecast.
- They are displayed separately as "uncertain / overdue receivables".
- An overdue collection enters the forecast only after the owner records a revised expected payment date for it.
- This assumption must be stated clearly on the forecast screen and in the explainability panel.

## 21.4 Cash safety threshold

- The system default is ₹0.
- The default must be labelled as a system default, not as a recommended business threshold.
- The owner can configure the threshold in settings.

## 21.5 Credit-sale dates

- Transaction date is mandatory.
- Expected payment date is optional.
- A credit sale with no expected payment date is recorded and counts toward customer outstanding, but is excluded from forecast inflows until a date is entered.
- Such sales are shown in their own list labelled "no expected collection date".

## 21.6 Time zone

- All business dates, overdue calculations, dashboard dates and forecasts use Asia/Kolkata (IST), consistently.
- "Today" is the IST calendar date.

## 21.7 Alert auto-resolution

- Customer overdue alert: resolves only when the customer's outstanding amount reaches zero.
- Supplier alert: resolves when the bill is fully paid or cancelled.
- Expense alert: resolves when the expense is paid or cancelled.
- Cash-shortage alert: resolves when the forecast no longer breaches the configured safety threshold.
- A partial payment updates the alert amount but must not resolve the alert.

## 21.8 Demo data

- Demo dates are generated relative to the application's current date in Asia/Kolkata when the demo is seeded.
- Sample transactions, due dates, overdue durations and forecast results must be internally consistent with each other.
- Synthetic data only. No real names, phone numbers or financial details.

## 21.9 Free-resource stack

Decision: use free resources. Every item below is a PLANNED choice. Before use, each must be checked against its provider's current official free-tier limits, card requirement, sleep/pause behaviour, backup availability and hackathon-use terms, as required by Part 19.5. Where Codebenders itself provides a suitable capability, prefer it (Part 19.2) and record the choice in the iteration log.

| Need | Planned choice | Licence / terms | Verify at setup |
|---|---|---|---|
| Language and framework | TypeScript with Next.js (App Router), one deployable app | MIT | Confirm Codebenders can build and run it |
| UI styling | Tailwind CSS | MIT | — |
| Validation | Zod | MIT | — |
| Database | PostgreSQL on a free hosted tier (for example Neon or Supabase free plan) | Open-source engine; provider terms apply | Storage, pause/idle policy, backup availability, region |
| ORM and migrations | Drizzle ORM | Apache-2.0 | — |
| Authentication | Auth.js (NextAuth) with credentials login; password hashing with bcryptjs | ISC / MIT | Session cookie flags (HttpOnly, Secure, SameSite); login rate limiting |
| Hosting | Vercel Hobby free plan, or Codebenders deployment if available | Vercel Hobby terms restrict commercial use | Confirm the hackathon/demo use is permitted; cold-start behaviour |
| Charts | Recharts | MIT | Bundle size |
| Icons | Lucide | ISC | — |
| Hindi font | Noto Sans Devanagari, self-hosted | SIL Open Font License | Licence notice to keep with the app |
| i18n | Typed dictionary of English and Hindi keys, no runtime library | Project code | — |
| Tests | Vitest for the domain engine and Part 12.3 matrix; Playwright for end-to-end flows if time allows | MIT / Apache-2.0 | Browser install size on the build machine |
| Source control | The existing git repository in this folder | — | Confirm event rules on repository hosting |

Financial rules that must hold regardless of stack:
- Money is stored as integer paise.
- Each payment write runs inside a database transaction and re-checks the remaining amount with a row lock.
- Each payment record carries a unique idempotency key.
- The what-if scenario is computed in memory and is never stored as a financial record, which resolves the Scenario entity question in Part 8.2.

## 21.10 Remaining verification items

Before the build starts:
1. Confirm whether Codebenders provides hosting, a database and authentication.
2. Confirm with the organisers that planning and specification assistance is permitted (Part 0 and Part 14.1).
3. Verify each free-tier provider's current limits and terms, and record the results in the dependency register in Part 14.4.


