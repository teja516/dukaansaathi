import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  json,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const interfaceLanguageEnum = pgEnum('interface_language', ['english', 'hindi']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'upi', 'bank']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partially_paid', 'paid']);
export const cashDirectionEnum = pgEnum('cash_direction', ['inflow', 'outflow']);
export const expenseCategoryEnum = pgEnum('expense_category', [
  'rent',
  'electricity',
  'wages',
  'transport',
  'other',
]);
export const expenseStatusEnum = pgEnum('expense_status', ['unpaid', 'paid', 'cancelled']);
export const alertTypeEnum = pgEnum('alert_type', [
  'customer_payment_overdue',
  'customer_expected_payment_not_received',
  'supplier_bill_due_soon',
  'supplier_bill_overdue',
  'expense_due_soon',
  'projected_cash_shortage',
  'forecast_data_incomplete',
]);
export const alertFilterCategoryEnum = pgEnum('alert_filter_category', [
  'collections',
  'supplier',
  'expenses',
  'cash_risk',
]);
export const alertStatusEnum = pgEnum('alert_status', [
  'new',
  'reviewed',
  'action_taken',
  'resolved',
]);
export const sourceRecordTypeEnum = pgEnum('source_record_type', [
  'credit_transaction',
  'supplier_bill',
  'expense',
  'forecast',
]);
export const userRoleEnum = pgEnum('user_role', ['shopkeeper']);

// ---------------------------------------------------------------------------
// Shared column helpers
// ---------------------------------------------------------------------------

const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...timestamps(),
  shopName: text('shop_name').notNull(),
  ownerName: text('owner_name'),
  currency: text('currency').notNull().default('INR'),
  interfaceLanguage: interfaceLanguageEnum('interface_language').notNull().default('english'),
  openingCashBalancePaise: integer('opening_cash_balance_paise').notNull().default(0),
  openingBankBalancePaise: integer('opening_bank_balance_paise').notNull().default(0),
  // System default 0; labelled as a default in the UI.
  cashSafetyThresholdPaise: integer('cash_safety_threshold_paise').notNull().default(0),
  setupCompletedAt: timestamp('setup_completed_at', { withTimezone: true }),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...timestamps(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  shopId: uuid('shop_id').references(() => shops.id),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  failedLoginCount: integer('failed_login_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  sessionVersion: integer('session_version').notNull().default(0),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
  passwordResetTokenHash: text('password_reset_token_hash'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at', { withTimezone: true }),
  passwordResetRequestedAt: timestamp('password_reset_requested_at', { withTimezone: true }),
  passwordResetUsedAt: timestamp('password_reset_used_at', { withTimezone: true }),
  passwordResetFailedAttempts: integer('password_reset_failed_attempts').notNull().default(0),
  passwordResetLockedUntil: timestamp('password_reset_locked_until', { withTimezone: true }),
  role: userRoleEnum('role').notNull().default('shopkeeper'),
  // Single column for the user's UI language. Requirement aliases
  // (language, language_preference) describe this same concept.
  preferredLanguage: interfaceLanguageEnum('preferred_language').notNull().default('english'),
});

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    name: text('name').notNull(),
    phoneNumber: text('phone_number'),
    notes: text('notes'),
    isSample: boolean('is_sample'),
  },
  (table) => [
    index('customers_shop_id_idx').on(table.shopId),
    // Postgres treats NULLs as distinct, so customers without a phone are unaffected.
    uniqueIndex('customers_shop_phone_uidx').on(table.shopId, table.phoneNumber),
  ],
);

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    name: text('name').notNull(),
    phoneNumber: text('phone_number'),
    notes: text('notes'),
    isSample: boolean('is_sample'),
  },
  (table) => [index('suppliers_shop_id_idx').on(table.shopId)],
);

export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    amountPaise: integer('amount_paise').notNull(),
    remainingAmountPaise: integer('remaining_amount_paise').notNull(),
    transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
    expectedPaymentDate: date('expected_payment_date', { mode: 'string' }),
    description: text('description'),
    status: paymentStatusEnum('status').notNull().default('unpaid'),
    isSample: boolean('is_sample'),
  },
  (table) => [
    check('credit_amount_positive', sql`${table.amountPaise} > 0`),
    check('credit_remaining_valid', sql`${table.remainingAmountPaise} >= 0 and ${table.remainingAmountPaise} <= ${table.amountPaise}`),
    index('credit_transactions_shop_customer_idx').on(table.shopId, table.customerId),
    index('credit_transactions_shop_expected_idx').on(table.shopId, table.expectedPaymentDate),
  ],
);

export const customerPayments = pgTable(
  'customer_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    creditTransactionId: uuid('credit_transaction_id')
      .notNull()
      .references(() => creditTransactions.id),
    amountPaise: integer('amount_paise').notNull(),
    paymentDate: date('payment_date', { mode: 'string' }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
    note: text('note'),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    isSample: boolean('is_sample'),
    // A payment is never deleted: a reversal marks it and posts an opposite cash movement.
    reversedAt: timestamp('reversed_at', { withTimezone: true }),
    reversalReason: text('reversal_reason'),
    reversedByUserId: uuid('reversed_by_user_id').references(() => users.id),
  },
  (table) => [
    check('customer_payment_amount_positive', sql`${table.amountPaise} > 0`),
    index('customer_payments_customer_idx').on(table.customerId),
    index('customer_payments_credit_idx').on(table.creditTransactionId),
  ],
);

export const supplierBills = pgTable(
  'supplier_bills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    amountPaise: integer('amount_paise').notNull(),
    remainingAmountPaise: integer('remaining_amount_paise').notNull(),
    billDate: date('bill_date', { mode: 'string' }).notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    description: text('description'),
    status: paymentStatusEnum('status').notNull().default('unpaid'),
    isSample: boolean('is_sample'),
    reference: text('reference'),
  },
  (table) => [
    check('bill_amount_positive', sql`${table.amountPaise} > 0`),
    check('bill_remaining_valid', sql`${table.remainingAmountPaise} >= 0 and ${table.remainingAmountPaise} <= ${table.amountPaise}`),
    index('supplier_bills_shop_due_idx').on(table.shopId, table.dueDate),
    index('supplier_bills_supplier_idx').on(table.supplierId),
  ],
);

export const supplierPayments = pgTable(
  'supplier_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    supplierBillId: uuid('supplier_bill_id')
      .notNull()
      .references(() => supplierBills.id),
    amountPaise: integer('amount_paise').notNull(),
    paymentDate: date('payment_date', { mode: 'string' }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
    note: text('note'),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    isSample: boolean('is_sample'),
    // A payment is never deleted: a reversal marks it and posts an opposite cash movement.
    reversedAt: timestamp('reversed_at', { withTimezone: true }),
    reversalReason: text('reversal_reason'),
    reversedByUserId: uuid('reversed_by_user_id').references(() => users.id),
  },
  (table) => [
    check('supplier_payment_amount_positive', sql`${table.amountPaise} > 0`),
    index('supplier_payments_supplier_idx').on(table.supplierId),
    index('supplier_payments_bill_idx').on(table.supplierBillId),
  ],
);

// Model name kept as "Expens" to match the rest of the app.
export const expens = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    category: expenseCategoryEnum('category').notNull(),
    amountPaise: integer('amount_paise').notNull(),
    expenseDate: date('expense_date', { mode: 'string' }).notNull(),
    dueDate: date('due_date', { mode: 'string' }),
    status: expenseStatusEnum('status').notNull().default('unpaid'),
    paymentDate: date('payment_date', { mode: 'string' }),
    paymentMethod: paymentMethodEnum('payment_method'),
    description: text('description'),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    isSample: boolean('is_sample'),
  },
  (table) => [
    check('expense_amount_positive', sql`${table.amountPaise} > 0`),
    index('expenses_shop_status_due_idx').on(table.shopId, table.status, table.dueDate),
  ],
);

export const cashMovements = pgTable(
  'cash_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    direction: cashDirectionEnum('direction').notNull(),
    amountPaise: integer('amount_paise').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    movementDate: date('movement_date', { mode: 'string' }).notNull(),
    customerPaymentId: uuid('customer_payment_id').references(() => customerPayments.id),
    supplierPaymentId: uuid('supplier_payment_id').references(() => supplierPayments.id),
    expenseId: uuid('expense_id').references(() => expens.id),
    // Generic reference to the originating record (requirement: source_id and source_record_id).
    sourceId: text('source_id'),
    sourceRecordId: text('source_record_id'),
    isSample: boolean('is_sample'),
  },
  (table) => [
    check('cash_movement_amount_positive', sql`${table.amountPaise} > 0`),
    index('cash_movements_shop_date_idx').on(table.shopId, table.movementDate),
  ],
);

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    alertType: alertTypeEnum('alert_type').notNull(),
    filterCategory: alertFilterCategoryEnum('filter_category').notNull(),
    status: alertStatusEnum('status').notNull().default('new'),
    priorityRank: integer('priority_rank').notNull(),
    amountPaise: integer('amount_paise'),
    dueDate: date('due_date', { mode: 'string' }),
    sourceRecordType: sourceRecordTypeEnum('source_record_type').notNull(),
    sourceRecordId: text('source_record_id'),
    customerId: uuid('customer_id').references(() => customers.id),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    actionTakenAt: timestamp('action_taken_at', { withTimezone: true }),
    actionNote: text('action_note'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [index('alerts_shop_status_rank_idx').on(table.shopId, table.status, table.priorityRank)],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id),
    actionType: text('action_type').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadata: json('metadata'),
  },
  (table) => [index('audit_events_shop_created_idx').on(table.shopId, table.createdAt)],
);

export const customerPaymentAllocations = pgTable(
  'customer_payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    customerPaymentId: uuid('customer_payment_id')
      .notNull()
      .references(() => customerPayments.id),
    creditTransactionId: uuid('credit_transaction_id')
      .notNull()
      .references(() => creditTransactions.id),
    amountPaise: integer('amount_paise').notNull(),
  },
  (table) => [
    index('cpa_payment_idx').on(table.customerPaymentId),
    index('cpa_credit_idx').on(table.creditTransactionId),
  ],
);

export const supplierPaymentAllocations = pgTable(
  'supplier_payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...timestamps(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    supplierPaymentId: uuid('supplier_payment_id')
      .notNull()
      .references(() => supplierPayments.id),
    supplierBillId: uuid('supplier_bill_id')
      .notNull()
      .references(() => supplierBills.id),
    amountPaise: integer('amount_paise').notNull(),
  },
  (table) => [
    index('spa_payment_idx').on(table.supplierPaymentId),
    index('spa_bill_idx').on(table.supplierBillId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const shopsRelations = relations(shops, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  suppliers: many(suppliers),
  creditTransactions: many(creditTransactions),
  customerPayments: many(customerPayments),
  supplierBills: many(supplierBills),
  supplierPayments: many(supplierPayments),
  expenses: many(expens),
  cashMovements: many(cashMovements),
  alerts: many(alerts),
  auditEvents: many(auditEvents),
  customerPaymentAllocations: many(customerPaymentAllocations),
  supplierPaymentAllocations: many(supplierPaymentAllocations),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  shop: one(shops, { fields: [users.shopId], references: [shops.id] }),
  reviewedAlerts: many(alerts),
  auditEvents: many(auditEvents),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  shop: one(shops, { fields: [customers.shopId], references: [shops.id] }),
  creditTransactions: many(creditTransactions),
  customerPayments: many(customerPayments),
  alerts: many(alerts),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  shop: one(shops, { fields: [suppliers.shopId], references: [shops.id] }),
  supplierBills: many(supplierBills),
  supplierPayments: many(supplierPayments),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one, many }) => ({
  shop: one(shops, { fields: [creditTransactions.shopId], references: [shops.id] }),
  customer: one(customers, {
    fields: [creditTransactions.customerId],
    references: [customers.id],
  }),
  customerPayments: many(customerPayments),
  customerPaymentAllocations: many(customerPaymentAllocations),
}));

export const customerPaymentsRelations = relations(customerPayments, ({ one, many }) => ({
  shop: one(shops, { fields: [customerPayments.shopId], references: [shops.id] }),
  customer: one(customers, {
    fields: [customerPayments.customerId],
    references: [customers.id],
  }),
  creditTransaction: one(creditTransactions, {
    fields: [customerPayments.creditTransactionId],
    references: [creditTransactions.id],
  }),
  allocations: many(customerPaymentAllocations),
  cashMovements: many(cashMovements),
}));

export const supplierBillsRelations = relations(supplierBills, ({ one, many }) => ({
  shop: one(shops, { fields: [supplierBills.shopId], references: [shops.id] }),
  supplier: one(suppliers, {
    fields: [supplierBills.supplierId],
    references: [suppliers.id],
  }),
  supplierPayments: many(supplierPayments),
  allocations: many(supplierPaymentAllocations),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one, many }) => ({
  shop: one(shops, { fields: [supplierPayments.shopId], references: [shops.id] }),
  supplier: one(suppliers, {
    fields: [supplierPayments.supplierId],
    references: [suppliers.id],
  }),
  supplierBill: one(supplierBills, {
    fields: [supplierPayments.supplierBillId],
    references: [supplierBills.id],
  }),
  allocations: many(supplierPaymentAllocations),
  cashMovements: many(cashMovements),
}));

export const expensRelations = relations(expens, ({ one, many }) => ({
  shop: one(shops, { fields: [expens.shopId], references: [shops.id] }),
  cashMovements: many(cashMovements),
}));

export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
  shop: one(shops, { fields: [cashMovements.shopId], references: [shops.id] }),
  customerPayment: one(customerPayments, {
    fields: [cashMovements.customerPaymentId],
    references: [customerPayments.id],
  }),
  supplierPayment: one(supplierPayments, {
    fields: [cashMovements.supplierPaymentId],
    references: [supplierPayments.id],
  }),
  expense: one(expens, {
    fields: [cashMovements.expenseId],
    references: [expens.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  shop: one(shops, { fields: [alerts.shopId], references: [shops.id] }),
  customer: one(customers, { fields: [alerts.customerId], references: [customers.id] }),
  reviewedBy: one(users, { fields: [alerts.reviewedByUserId], references: [users.id] }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  shop: one(shops, { fields: [auditEvents.shopId], references: [shops.id] }),
  actor: one(users, { fields: [auditEvents.actorUserId], references: [users.id] }),
}));

export const customerPaymentAllocationsRelations = relations(
  customerPaymentAllocations,
  ({ one }) => ({
    shop: one(shops, {
      fields: [customerPaymentAllocations.shopId],
      references: [shops.id],
    }),
    customerPayment: one(customerPayments, {
      fields: [customerPaymentAllocations.customerPaymentId],
      references: [customerPayments.id],
    }),
    creditTransaction: one(creditTransactions, {
      fields: [customerPaymentAllocations.creditTransactionId],
      references: [creditTransactions.id],
    }),
  }),
);

export const supplierPaymentAllocationsRelations = relations(
  supplierPaymentAllocations,
  ({ one }) => ({
    shop: one(shops, {
      fields: [supplierPaymentAllocations.shopId],
      references: [shops.id],
    }),
    supplierPayment: one(supplierPayments, {
      fields: [supplierPaymentAllocations.supplierPaymentId],
      references: [supplierPayments.id],
    }),
    supplierBill: one(supplierBills, {
      fields: [supplierPaymentAllocations.supplierBillId],
      references: [supplierBills.id],
    }),
  }),
);