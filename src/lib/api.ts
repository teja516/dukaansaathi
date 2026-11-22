// Auto-generated typed API client — the app's single fetch surface.
// Request bodies are typed against the database schema, so calling an
// endpoint with the wrong field names is a compile error. Do not hand-
// edit — regenerate from the API atlas + schema instead.

import { getToken } from '@/lib/authToken';

// Mock mode: the IDE preview boots before any database exists, so the
// single fetch surface answers locally instead of calling routes that
// would fail on a missing DATABASE_URL. Mirrors the demo session in
// @/lib/authContext so both auth surfaces agree.
// The `process.env.NEXT_PUBLIC_MOCK_MODE` form is deliberate: Next inlines
// that EXACT text at build time. `process.env?.X` or a computed key is not
// matched by the inliner, so it would compile to a lookup that is always
// undefined in the browser bundle — the same way a dynamic
// `process.env['NEXT_PUBLIC_' + name]` once left the preview inspector
// permanently inert. Do not add optional chaining here.
const __NEXEN_IS_MOCK__ =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_MOCK_MODE === 'true') ||
  (typeof process !== 'undefined' && process.env.MOCK_MODE === 'true') ||
  ((globalThis as unknown as { __NEXEN_MOCK__?: boolean }).__NEXEN_MOCK__ === true);

const __NEXEN_DEMO_USER__ = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'shopkeeper',
};

const __NEXEN_MOCK_ROWS__: Record<string, any[]> = {
  "shops": [
    {
      "id": "sh1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopName": "श्री लक्ष्मी जनरल स्टोर्स",
      "ownerName": "Rameshwar Gupta",
      "currency": "sample_currency_1",
      "interfaceLanguage": "hi",
      "openingCashBalancePaise": 3,
      "openingBankBalancePaise": 3,
      "cashSafetyThresholdPaise": 3,
      "setupCompletedAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "sh2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopName": "माँ अन्नपूर्णा किराना",
      "ownerName": "Sunita Devi",
      "currency": "sample_currency_2",
      "interfaceLanguage": "en",
      "openingCashBalancePaise": 10,
      "openingBankBalancePaise": 10,
      "cashSafetyThresholdPaise": 10,
      "setupCompletedAt": "2026-02-15T10:00:00Z"
    },
    {
      "id": "shop_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopName": "श्री लक्ष्मी जनरल स्टोर्स",
      "ownerName": "Rameshwar Gupta",
      "currency": "sample_currency_3",
      "interfaceLanguage": "hi",
      "openingCashBalancePaise": 17,
      "openingBankBalancePaise": 17,
      "cashSafetyThresholdPaise": 17,
      "setupCompletedAt": "2026-03-15T10:00:00Z"
    }
  ],
  "users": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "name": "Demo User",
      "email": "demo@example.com",
      "shopId": "sh1",
      "lastLoginAt": "2026-01-15T10:00:00Z",
      "failedLoginCount": 3,
      "lockedUntil": "2026-01-15T10:00:00Z",
      "sessionVersion": 3,
      "passwordChangedAt": "2026-01-15T10:00:00Z",
      "passwordResetTokenHash": "sample_passwordresettokenhash_1",
      "passwordResetExpiresAt": "2026-01-15T10:00:00Z",
      "passwordResetRequestedAt": "2026-01-15T10:00:00Z",
      "passwordResetUsedAt": "2026-01-15T10:00:00Z",
      "passwordResetFailedAttempts": 3,
      "passwordResetLockedUntil": "2026-01-15T10:00:00Z"
    },
    {
      "id": "u2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "name": "Sunita Devi",
      "email": "sunita.devi@annapurnakirana.in",
      "shopId": "sh2",
      "lastLoginAt": "2026-02-15T10:00:00Z",
      "failedLoginCount": 10,
      "lockedUntil": "2026-02-15T10:00:00Z",
      "sessionVersion": 10,
      "passwordChangedAt": "2026-02-15T10:00:00Z",
      "passwordResetTokenHash": "sample_passwordresettokenhash_2",
      "passwordResetExpiresAt": "2026-02-15T10:00:00Z",
      "passwordResetRequestedAt": "2026-02-15T10:00:00Z",
      "passwordResetUsedAt": "2026-02-15T10:00:00Z",
      "passwordResetFailedAttempts": 10,
      "passwordResetLockedUntil": "2026-02-15T10:00:00Z"
    },
    {
      "id": "user_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "name": "Rameshwar Gupta",
      "email": "3-rameshwar.gupta@lakshmistores.in",
      "shopId": "shop_003",
      "lastLoginAt": "2026-03-15T10:00:00Z",
      "failedLoginCount": 17,
      "lockedUntil": "2026-03-15T10:00:00Z",
      "sessionVersion": 17,
      "passwordChangedAt": "2026-03-15T10:00:00Z",
      "passwordResetTokenHash": "sample_passwordresettokenhash_3",
      "passwordResetExpiresAt": "2026-03-15T10:00:00Z",
      "passwordResetRequestedAt": "2026-03-15T10:00:00Z",
      "passwordResetUsedAt": "2026-03-15T10:00:00Z",
      "passwordResetFailedAttempts": 17,
      "passwordResetLockedUntil": "2026-03-15T10:00:00Z"
    }
  ],
  "customers": [
    {
      "id": "c1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Ravi Sharma",
      "phoneNumber": "9812034417",
      "notes": "रोज़ सुबह दूध और ब्रेड लेते हैं",
      "isSample": true
    },
    {
      "id": "c2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Suresh Yadav",
      "phoneNumber": "sample_phonenumber_2",
      "notes": "महीने के आखिर में हिसाब करते हैं",
      "isSample": false
    },
    {
      "id": "c3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Lakshmi Bai",
      "phoneNumber": "sample_phonenumber_3",
      "notes": "sample_notes_3",
      "isSample": true
    },
    {
      "id": "c4",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Imran Qureshi",
      "phoneNumber": "9655781290",
      "notes": "तनख्वाह मिलने पर पैसे देते हैं",
      "isSample": false
    },
    {
      "id": "c5",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Kamla Devi",
      "phoneNumber": "sample_phonenumber_5",
      "notes": "sample_notes_5",
      "isSample": true
    },
    {
      "id": "c6",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Anil Verma",
      "phoneNumber": "9919002376",
      "notes": "ठेले पर सब्ज़ी बेचते हैं",
      "isSample": false
    }
  ],
  "suppliers": [
    {
      "id": "sup1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "name": "ABC Distributors",
      "phoneNumber": "9810567823",
      "notes": "हर मंगलवार माल आता है",
      "isSample": true
    },
    {
      "id": "sup2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Krishna Wholesale",
      "phoneNumber": "sample_phonenumber_2",
      "notes": "दाल और तेल का थोक सप्लायर",
      "isSample": false
    },
    {
      "id": "sup3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "sh1",
      "name": "Gupta Oil & Dal Agency",
      "phoneNumber": "sample_phonenumber_3",
      "notes": "sample_notes_3",
      "isSample": true
    }
  ],
  "credit_transactions": [
    {
      "id": "credit_transaction_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "customerId": "c1",
      "amountPaise": 3,
      "remainingAmountPaise": 3,
      "transactionDate": "2026-01-15T10:00:00Z",
      "expectedPaymentDate": "2026-01-15T10:00:00Z",
      "description": "Sample description for record 1",
      "status": "active",
      "isSample": true
    },
    {
      "id": "credit_transaction_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh2",
      "customerId": "c2",
      "amountPaise": 10,
      "remainingAmountPaise": 10,
      "transactionDate": "2026-02-15T10:00:00Z",
      "expectedPaymentDate": "2026-02-15T10:00:00Z",
      "description": "Sample description for record 2",
      "status": "pending",
      "isSample": false
    },
    {
      "id": "credit_transaction_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "shop_003",
      "customerId": "c3",
      "amountPaise": 17,
      "remainingAmountPaise": 17,
      "transactionDate": "2026-03-15T10:00:00Z",
      "expectedPaymentDate": "2026-03-15T10:00:00Z",
      "description": "Sample description for record 3",
      "status": "archived",
      "isSample": true
    }
  ],
  "customer_payments": [
    {
      "id": "cp1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "customerId": "c1",
      "creditTransactionId": "credit_transaction_001",
      "amountPaise": 3,
      "paymentDate": "2026-11-10",
      "paymentMethod": "cash",
      "note": "sample_note_1",
      "idempotencyKey": "sample_idempotencykey_1",
      "isSample": true
    },
    {
      "id": "cp2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh1",
      "customerId": "c6",
      "creditTransactionId": "credit_transaction_002",
      "amountPaise": 10,
      "paymentDate": "2026-11-02",
      "paymentMethod": "upi",
      "note": "sample_note_2",
      "idempotencyKey": "sample_idempotencykey_2",
      "isSample": false
    },
    {
      "id": "cp3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "sh1",
      "customerId": "c2",
      "creditTransactionId": "credit_transaction_003",
      "amountPaise": 17,
      "paymentDate": "2026-11-19",
      "paymentMethod": "upi",
      "note": "sample_note_3",
      "idempotencyKey": "sample_idempotencykey_3",
      "isSample": true
    },
    {
      "id": "cp4",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "shopId": "sh1",
      "customerId": "c3",
      "creditTransactionId": "credit_transaction_001",
      "amountPaise": 24,
      "paymentDate": "2026-11-14",
      "paymentMethod": "cash",
      "note": "sample_note_4",
      "idempotencyKey": "sample_idempotencykey_4",
      "isSample": false
    },
    {
      "id": "cp5",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "shopId": "sh1",
      "customerId": "c4",
      "creditTransactionId": "credit_transaction_002",
      "amountPaise": 31,
      "paymentDate": "2026-11-21",
      "paymentMethod": "cash",
      "note": "sample_note_5",
      "idempotencyKey": "sample_idempotencykey_5",
      "isSample": true
    }
  ],
  "supplier_bills": [
    {
      "id": "sb1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup1",
      "amountPaise": 3,
      "remainingAmountPaise": 3,
      "billDate": "2026-11-10",
      "dueDate": "2026-11-24",
      "description": "Sample description for record 1",
      "status": "active",
      "isSample": true,
      "reference": "INV-4471 गेहूँ और चावल"
    },
    {
      "id": "sb2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup2",
      "amountPaise": 10,
      "remainingAmountPaise": 10,
      "billDate": "2026-11-14",
      "dueDate": "2026-11-28",
      "description": "Sample description for record 2",
      "status": "pending",
      "isSample": false,
      "reference": "KW-2208 दाल"
    },
    {
      "id": "sb3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup1",
      "amountPaise": 17,
      "remainingAmountPaise": 17,
      "billDate": "2026-10-25",
      "dueDate": "2026-11-08",
      "description": "Sample description for record 3",
      "status": "archived",
      "isSample": true,
      "reference": "INV-4399 बिस्कुट और साबुन"
    },
    {
      "id": "sb4",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup3",
      "amountPaise": 24,
      "remainingAmountPaise": 24,
      "billDate": "2026-11-01",
      "dueDate": "2026-11-21",
      "description": "Sample description for record 4",
      "status": "active",
      "isSample": false,
      "reference": "GO-0917 सरसों तेल"
    },
    {
      "id": "sb5",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup2",
      "amountPaise": 31,
      "remainingAmountPaise": 31,
      "billDate": "2026-10-15",
      "dueDate": "2026-10-30",
      "description": "Sample description for record 5",
      "status": "pending",
      "isSample": true,
      "reference": "KW-2150 मसाले"
    }
  ],
  "supplier_payments": [
    {
      "id": "sp1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup1",
      "supplierBillId": "sb3",
      "amountPaise": 3,
      "paymentDate": "2026-11-05",
      "paymentMethod": "cash",
      "note": "बाकी जल्दी दूँगा",
      "idempotencyKey": "sample_idempotencykey_1",
      "isSample": true
    },
    {
      "id": "sp2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup2",
      "supplierBillId": "sb5",
      "amountPaise": 10,
      "paymentDate": "2026-10-29",
      "paymentMethod": "bank",
      "note": "sample_note_2",
      "idempotencyKey": "sample_idempotencykey_2",
      "isSample": false
    },
    {
      "id": "sp3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "sh1",
      "supplierId": "sup1",
      "supplierBillId": "sb1",
      "amountPaise": 17,
      "paymentDate": "2026-11-18",
      "paymentMethod": "upi",
      "note": "पहली किस्त",
      "idempotencyKey": "sample_idempotencykey_3",
      "isSample": true
    }
  ],
  "expenses": [
    {
      "id": "ex1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "category": "rent",
      "amountPaise": 3,
      "expenseDate": "2026-11-01",
      "dueDate": "2026-11-05",
      "status": "paid",
      "paymentDate": "2026-11-04",
      "paymentMethod": "cash",
      "description": "नवंबर का दुकान किराया",
      "idempotencyKey": "sample_idempotencykey_1",
      "isSample": true
    },
    {
      "id": "ex2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh1",
      "category": "electricity",
      "amountPaise": 10,
      "expenseDate": "2026-11-10",
      "dueDate": "2026-11-25",
      "status": "unpaid",
      "paymentDate": "2026-02-15T10:00:00Z",
      "paymentMethod": "sample_paymentmethod_2",
      "description": "नवंबर का बिजली बिल",
      "idempotencyKey": "sample_idempotencykey_2",
      "isSample": false
    },
    {
      "id": "ex3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "sh1",
      "category": "other",
      "amountPaise": 17,
      "expenseDate": "2026-11-15",
      "dueDate": "2026-11-23",
      "status": "unpaid",
      "paymentDate": "2026-03-15T10:00:00Z",
      "paymentMethod": "sample_paymentmethod_3",
      "description": "दुकान की मरम्मत और छोटे खर्च",
      "idempotencyKey": "sample_idempotencykey_3",
      "isSample": true
    },
    {
      "id": "ex4",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "shopId": "sh1",
      "category": "transport",
      "amountPaise": 24,
      "expenseDate": "2026-11-19",
      "dueDate": "2026-04-15T10:00:00Z",
      "status": "paid",
      "paymentDate": "2026-11-19",
      "paymentMethod": "cash",
      "description": "माल ढुलाई रिक्शा",
      "idempotencyKey": "sample_idempotencykey_4",
      "isSample": false
    },
    {
      "id": "ex5",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "shopId": "sh1",
      "category": "wages",
      "amountPaise": 31,
      "expenseDate": "2026-11-07",
      "dueDate": "2026-11-20",
      "status": "unpaid",
      "paymentDate": "2026-05-15T10:00:00Z",
      "paymentMethod": "sample_paymentmethod_5",
      "description": "सहायक की नवंबर पहली तनख्वाह",
      "idempotencyKey": "sample_idempotencykey_5",
      "isSample": true
    }
  ],
  "cash_movements": [
    {
      "id": "cash_movement_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "direction": "sample_direction_1",
      "amountPaise": 3,
      "paymentMethod": "sample_paymentmethod_1",
      "movementDate": "2026-01-15T10:00:00Z",
      "customerPaymentId": "cp1",
      "supplierPaymentId": "sp1",
      "expenseId": "ex1",
      "isSample": true
    },
    {
      "id": "cash_movement_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh2",
      "direction": "sample_direction_2",
      "amountPaise": 10,
      "paymentMethod": "sample_paymentmethod_2",
      "movementDate": "2026-02-15T10:00:00Z",
      "customerPaymentId": "cp2",
      "supplierPaymentId": "sp2",
      "expenseId": "ex2",
      "isSample": false
    },
    {
      "id": "cash_movement_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "shop_003",
      "direction": "sample_direction_3",
      "amountPaise": 17,
      "paymentMethod": "sample_paymentmethod_3",
      "movementDate": "2026-03-15T10:00:00Z",
      "customerPaymentId": "cp3",
      "supplierPaymentId": "sp3",
      "expenseId": "ex3",
      "isSample": true
    }
  ],
  "alerts": [
    {
      "id": "alert_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "alertType": "sample_alerttype_1",
      "filterCategory": "sample_filtercategory_1",
      "status": "active",
      "priorityRank": 3,
      "amountPaise": 3,
      "dueDate": "2026-01-15T10:00:00Z",
      "sourceRecordType": "sample_sourcerecordtype_1",
      "sourceRecordId": "sourcerecord_001",
      "customerId": "c1",
      "reviewedByUserId": "00000000-0000-4000-8000-000000000001",
      "reviewedAt": "2026-01-15T10:00:00Z",
      "actionTakenAt": "2026-01-15T10:00:00Z",
      "actionNote": "sample_actionnote_1",
      "resolvedAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "alert_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh2",
      "alertType": "sample_alerttype_2",
      "filterCategory": "sample_filtercategory_2",
      "status": "pending",
      "priorityRank": 10,
      "amountPaise": 10,
      "dueDate": "2026-02-15T10:00:00Z",
      "sourceRecordType": "sample_sourcerecordtype_2",
      "sourceRecordId": "sourcerecord_002",
      "customerId": "c2",
      "reviewedByUserId": "u2",
      "reviewedAt": "2026-02-15T10:00:00Z",
      "actionTakenAt": "2026-02-15T10:00:00Z",
      "actionNote": "sample_actionnote_2",
      "resolvedAt": "2026-02-15T10:00:00Z"
    },
    {
      "id": "alert_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "shop_003",
      "alertType": "sample_alerttype_3",
      "filterCategory": "sample_filtercategory_3",
      "status": "archived",
      "priorityRank": 17,
      "amountPaise": 17,
      "dueDate": "2026-03-15T10:00:00Z",
      "sourceRecordType": "sample_sourcerecordtype_3",
      "sourceRecordId": "sourcerecord_003",
      "customerId": "c3",
      "reviewedByUserId": "user_003",
      "reviewedAt": "2026-03-15T10:00:00Z",
      "actionTakenAt": "2026-03-15T10:00:00Z",
      "actionNote": "sample_actionnote_3",
      "resolvedAt": "2026-03-15T10:00:00Z"
    }
  ],
  "audit_events": [
    {
      "id": "audit_event_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "actionType": "sample_actiontype_1",
      "entityType": "sample_entitytype_1",
      "entityId": "entity_001",
      "metadata": {}
    },
    {
      "id": "audit_event_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh2",
      "actorUserId": "u2",
      "actionType": "sample_actiontype_2",
      "entityType": "sample_entitytype_2",
      "entityId": "entity_002",
      "metadata": {}
    },
    {
      "id": "audit_event_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "shop_003",
      "actorUserId": "user_003",
      "actionType": "sample_actiontype_3",
      "entityType": "sample_entitytype_3",
      "entityId": "entity_003",
      "metadata": {}
    }
  ],
  "customer_payment_allocations": [
    {
      "id": "customer_payment_allocation_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "customerPaymentId": "cp1",
      "creditTransactionId": "credit_transaction_001",
      "amountPaise": 3
    },
    {
      "id": "customer_payment_allocation_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh2",
      "customerPaymentId": "cp2",
      "creditTransactionId": "credit_transaction_002",
      "amountPaise": 10
    },
    {
      "id": "customer_payment_allocation_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "shop_003",
      "customerPaymentId": "cp3",
      "creditTransactionId": "credit_transaction_003",
      "amountPaise": 17
    }
  ],
  "supplier_payment_allocations": [
    {
      "id": "supplier_payment_allocation_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "shopId": "sh1",
      "supplierPaymentId": "sp1",
      "supplierBillId": "sb1",
      "amountPaise": 3
    },
    {
      "id": "supplier_payment_allocation_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "shopId": "sh2",
      "supplierPaymentId": "sp2",
      "supplierBillId": "sb2",
      "amountPaise": 10
    },
    {
      "id": "supplier_payment_allocation_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "shopId": "shop_003",
      "supplierPaymentId": "sp3",
      "supplierBillId": "sb3",
      "amountPaise": 17
    }
  ]
};
__NEXEN_MOCK_ROWS__["creditTransactions"] = __NEXEN_MOCK_ROWS__["credit_transactions"];
__NEXEN_MOCK_ROWS__["credit-transactions"] = __NEXEN_MOCK_ROWS__["credit_transactions"];
__NEXEN_MOCK_ROWS__["customer-payments"] = __NEXEN_MOCK_ROWS__["customer_payments"];
__NEXEN_MOCK_ROWS__["customerPayments"] = __NEXEN_MOCK_ROWS__["customer_payments"];
__NEXEN_MOCK_ROWS__["supplier-bills"] = __NEXEN_MOCK_ROWS__["supplier_bills"];
__NEXEN_MOCK_ROWS__["supplierBills"] = __NEXEN_MOCK_ROWS__["supplier_bills"];
__NEXEN_MOCK_ROWS__["supplier-payments"] = __NEXEN_MOCK_ROWS__["supplier_payments"];
__NEXEN_MOCK_ROWS__["supplierPayments"] = __NEXEN_MOCK_ROWS__["supplier_payments"];
__NEXEN_MOCK_ROWS__["cash-movements"] = __NEXEN_MOCK_ROWS__["cash_movements"];
__NEXEN_MOCK_ROWS__["cashMovements"] = __NEXEN_MOCK_ROWS__["cash_movements"];
__NEXEN_MOCK_ROWS__["audit-events"] = __NEXEN_MOCK_ROWS__["audit_events"];
__NEXEN_MOCK_ROWS__["auditEvents"] = __NEXEN_MOCK_ROWS__["audit_events"];
__NEXEN_MOCK_ROWS__["customer-payment-allocations"] = __NEXEN_MOCK_ROWS__["customer_payment_allocations"];
__NEXEN_MOCK_ROWS__["customerPaymentAllocations"] = __NEXEN_MOCK_ROWS__["customer_payment_allocations"];
__NEXEN_MOCK_ROWS__["supplier-payment-allocations"] = __NEXEN_MOCK_ROWS__["supplier_payment_allocations"];
__NEXEN_MOCK_ROWS__["supplierPaymentAllocations"] = __NEXEN_MOCK_ROWS__["supplier_payment_allocations"];

// ── Sample-data changes: kept for this browser tab ──────────────────────────
const __NEXEN_SAMPLE_KEY__ = 'nexen.sample.970e84a0b947';
let __sampleLoaded = false;
const __sampleCreated = new Set<string>();
const __sampleAnswered = new WeakMap<object, any>();
function __sampleTables(): string[] {
  const keys = Object.keys(__NEXEN_MOCK_ROWS__);
  return keys.filter((k, i) => keys.findIndex((j) => __NEXEN_MOCK_ROWS__[j] === __NEXEN_MOCK_ROWS__[k]) === i);
}
function __sampleLoad(): void {
  if (__sampleLoaded) return;
  __sampleLoaded = true;
  try {
    const saved = JSON.parse(globalThis.sessionStorage?.getItem(__NEXEN_SAMPLE_KEY__) ?? 'null');
    if (!saved || typeof saved !== 'object') return;
    for (const t of __sampleTables()) {
      const kept = saved.rows?.[t];
      if (Array.isArray(kept)) __NEXEN_MOCK_ROWS__[t].splice(0, __NEXEN_MOCK_ROWS__[t].length, ...kept);
    }
    for (const id of Array.isArray(saved.created) ? saved.created : []) __sampleCreated.add(String(id));
  } catch { /* blocked or unreadable storage: the sample rows as shipped */ }
}
function __sampleSave(): void {
  try {
    const rows: Record<string, any[]> = {};
    for (const t of __sampleTables()) rows[t] = __NEXEN_MOCK_ROWS__[t];
    globalThis.sessionStorage?.setItem(__NEXEN_SAMPLE_KEY__, JSON.stringify({ rows, created: Array.from(__sampleCreated) }));
  } catch { /* full or blocked: kept until the page reloads */ }
  // The IDE preview says, once, that this went to sample data only.
  try {
    if (typeof window !== 'undefined' && window.parent !== window) window.parent.postMessage({ type: 'nexen:sample-write' }, '*');
  } catch { /* no preview around this page */ }
}
function __sampleFind(all: any[], id: string): number {
  return all.findIndex((r) => String(r.id) === String(id) || String(r.slug) === String(id));
}
/** A field the person did not fill, as a new row of theirs would hold it. Links and
 *  status-like values keep a sample row's (pages read them); its text, dates and counts do
 *  not: a new habit showed "Sample description for record 1" and its reminder. */
function __sampleBlank(k: string, v: any): any {
  if (/(Id|_id)$/.test(k) || /status|state|role|type|kind|priority|category|level|currency|unit|visibility/i.test(k)) return v;
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return v;
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return null;
}
/** A new row: a sample row's fields (what pages read), the person's values in them. */
function __sampleInsert(table: string, body: any, links?: Record<string, string>): any {
  if (body && typeof body === 'object' && __sampleAnswered.has(body)) return __sampleAnswered.get(body);
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? (__NEXEN_MOCK_ROWS__[table] = []);
  const like: any = all[0] ?? {};
  const now = new Date().toISOString();
  const row: any = {};
  for (const [k, v] of Object.entries(like)) row[k] = __sampleBlank(k, v);
  Object.assign(row, body && typeof body === 'object' ? body : {}, links ?? {});
  row.id = typeof like.id === 'number'
    ? all.reduce((m: number, r: any) => Math.max(m, Number(r.id) || 0), 0) + 1
    : (globalThis.crypto?.randomUUID?.() ?? `sample-${Date.now().toString(36)}`);
  if ('slug' in like && !(body && body.slug)) row.slug = String(row.id);
  for (const k of ['createdAt', 'updatedAt', 'created_at', 'updated_at']) if (k in like) row[k] = now;
  all.unshift(row);
  __sampleCreated.add(String(row.id));
  if (body && typeof body === 'object') __sampleAnswered.set(body, row);
  __sampleSave();
  return row;
}
function __sampleUpdate(table: string, id: string, body: any): any {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  const changes: any = { ...(body && typeof body === 'object' ? body : {}) };
  delete changes.id;
  const i = __sampleFind(all, id);
  if (i < 0) return { ...__mockRow(table, id), ...changes };
  Object.assign(all[i], changes);
  for (const k of ['updatedAt', 'updated_at']) if (k in all[i]) all[i][k] = new Date().toISOString();
  __sampleSave();
  return all[i];
}
function __sampleDelete(table: string, id: string): undefined {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  const i = __sampleFind(all, id);
  if (i >= 0) {
    all.splice(i, 1);
    __sampleSave();
  }
  return undefined;
}
/** A write no designed endpoint answers, applied to the table its path names. */
function __sampleWrite(method: string, path: string, body: any): any {
  const segs = path.split('/').filter(Boolean);
  for (let i = segs.length - 1; i >= 0; i -= 1) {
    if (!__NEXEN_MOCK_ROWS__[segs[i]]) continue;
    if (i === segs.length - 1 && method === 'POST') return __sampleInsert(segs[i], body);
    if (i === segs.length - 2 && (method === 'PATCH' || method === 'PUT')) return __sampleUpdate(segs[i], decodeURIComponent(segs[i + 1]), body);
    if (i === segs.length - 2 && method === 'DELETE') return __sampleDelete(segs[i], decodeURIComponent(segs[i + 1]));
    return undefined;
  }
  return undefined;
}

function __mockRows(table: string, where?: Record<string, string>): any[] {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  if (!where || !Object.keys(where).length) return all;
  const hit = all.filter((r) => Object.entries(where).every(([k, v]) => String(r[k]) === String(v)));
  // A parent added in this tab has no children yet: none, not every sample row.
  return hit.length || Object.values(where).some((v) => __sampleCreated.has(String(v))) ? hit : all;
}

function __mockRow(table: string, id?: string): any {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  return (id !== undefined && all.find((r) => String(r.id) === String(id) || String(r.slug) === String(id))) || all[0] || {};
}

/** One answer per designed endpoint, in the shape the API Layer declares for it. */
const __NEXEN_MOCK_ROUTES__: Array<[string, RegExp, (p: string[], body: any) => any]> = [
  ["GET", /^\/api\/customer-payments\/preview$/, (p, body) => ({ "outstanding_before_paise": 3, "received_paise": 3, "outstanding_after_paise": 3, "allocations": [({ "credit_transaction_id": "credit_transaction__001", "amount_paise": 3 })] })],
  ["GET", /^\/api\/supplier-payments\/preview$/, (p, body) => ({ "supplier_bill_id": "supplier_bill__001", "remaining_before_paise": 3, "paid_paise": 3, "remaining_after_paise": 3, "allocations": [({ "supplier_bill_id": "supplier_bill__001", "amount_paise": 3 })] })],
  ["GET", /^\/api\/credit-transactions$/, (p, body) => ({ "items": [({ "id": "id_001", "customer_id": "customer__001", "customer_name": "sample_customer_name_1", "amount_paise": 3, "remaining_amount_paise": 3, "transaction_date": "2026-01-15T10:00:00Z", "expected_payment_date": "2026-01-15T10:00:00Z", "description": "Sample description for record 1", "status": "active" })], "total": 3 })],
  ["POST", /^\/api\/credit-transactions$/, (p, body) => __sampleInsert("credit_transactions", body)],
  ["GET", /^\/api\/cash-survival-radar$/, (p, body) => ({ "risk_state": "normal", "safety_threshold_paise": 3, "lowest_balance_paise": 3, "lowest_balance_date": "2026-01-15T10:00:00Z", "shortfall_paise": 3, "curve": [({ "date": "2026-01-15T10:00:00Z", "closing_balance_paise": 3 })], "drivers": ({ "collections": [({ "credit_transaction_id": "credit_transaction__001", "customer_name": "sample_customer_name_1", "amount_paise": 3, "expected_payment_date": "2026-01-15T10:00:00Z" })], "obligations": [({ "source_type": "sample_source_type_1", "source_id": "source__001", "label": "Onboard new team members", "amount_paise": 3, "due_date": "2026-01-15T10:00:00Z" })] }), "calculated_at": "2026-01-15T10:00:00Z" })],
  ["GET", /^\/api\/customer-payments$/, (p, body) => __mockRows("customer_payments")],
  ["POST", /^\/api\/customer-payments$/, (p, body) => __sampleInsert("customer_payments", body)],
  ["GET", /^\/api\/supplier-payments$/, (p, body) => __mockRows("supplier_payments")],
  ["POST", /^\/api\/supplier-payments$/, (p, body) => __sampleInsert("supplier_payments", body)],
  ["GET", /^\/api\/what-if-scenario$/, (p, body) => ({ "simulated": null, "original": ({ "lowest_balance_paise": 3, "lowest_balance_date": "2026-01-15T10:00:00Z" }), "revised": ({ "lowest_balance_paise": 3, "lowest_balance_date": "2026-01-15T10:00:00Z" }), "difference_paise": 3, "new_shortage_paise": 3, "affected_obligations": [({ "source_type": "sample_source_type_1", "source_id": "source__001", "label": "Onboard new team members", "amount_paise": 3, "due_date": "2026-01-15T10:00:00Z" })], "suggested_action": "sample_suggested_action_1" })],
  ["GET", /^\/api\/available-cash$/, (p, body) => ({ "available_paise": 3, "cash_in_hand_paise": 3, "bank_upi_paise": 3, "opening_cash_paise": 3, "opening_bank_upi_paise": 3, "recent_movements": [({ "id": "id_001", "direction": "inflow", "amount_paise": 3, "payment_method": "sample_payment_method_1", "movement_date": "2026-01-15T10:00:00Z", "source_type": "sample_source_type_1", "source_id": "source__001" })], "calculated_at": "2026-01-15T10:00:00Z" })],
  ["GET", /^\/api\/supplier-bills$/, (p, body) => [({ "id": "id_001", "supplier_id": "supplier__001", "supplier_name": "sample_supplier_name_1", "bill_date": "2026-01-15T10:00:00Z", "due_date": "2026-01-15T10:00:00Z", "amount_paise": 3, "remaining_amount_paise": 3, "status": "active", "overdue": true })]],
  ["POST", /^\/api\/supplier-bills$/, (p, body) => __sampleInsert("supplier_bills", body)],
  ["GET", /^\/api\/cash-movements$/, (p, body) => ({ "items": __mockRows("cash_movements"), "next_cursor": "sample_next_cursor_1" })],
  ["GET", /^\/api\/cash-forecast$/, (p, body) => ({ "period_days": 3, "starting_available_paise": 3, "lowest_balance_paise": 3, "lowest_balance_date": "2026-01-15T10:00:00Z", "expected_inflows_paise": 3, "scheduled_outflows_paise": 3, "overdue_excluded_paise": 3, "days": [({ "date": "2026-01-15T10:00:00Z", "inflow_paise": 3, "outflow_paise": 3, "closing_balance_paise": 3 })], "events": [({ "date": "2026-01-15T10:00:00Z", "kind": "expected_collection", "label": "Onboard new team members", "amount_paise": 3, "source_type": "sample_source_type_1", "source_id": "source__001" })], "assumptions": ["sample_assumptions_1"], "calculated_at": "2026-01-15T10:00:00Z" })],
  ["GET", /^\/api\/customers$/, (p, body) => ({ "items": [({ "id": "id_001", "name": "Jane Doe", "phone_number": "sample_phone_number_1", "outstanding_paise": 3, "overdue_paise": 3, "oldest_unpaid_date": "2026-01-15T10:00:00Z", "due_status": "clear" })], "total": 3 })],
  ["POST", /^\/api\/customers$/, (p, body) => __sampleInsert("customers", body)],
  ["GET", /^\/api\/suppliers$/, (p, body) => ({ "items": [({ "id": "id_001", "name": "Jane Doe", "phone_number": "sample_phone_number_1", "payable_paise": 3, "nearest_unpaid_due_date": "2026-01-15T10:00:00Z", "is_overdue": true })], "total": 3 })],
  ["POST", /^\/api\/suppliers$/, (p, body) => __sampleInsert("suppliers", body)],
  ["GET", /^\/api\/dashboard$/, (p, body) => ({ "shop_name": "sample_shop_name_1", "today_ist": "sample_today_ist_1", "available_cash_paise": 3, "customer_outstanding_paise": 3, "overdue_customer_paise": 3, "supplier_outstanding_paise": 3, "next_7_days": ({ "incoming_paise": 3, "outgoing_paise": 3, "schedule": [({ "date": "2026-01-15T10:00:00Z", "kind": "sample_kind_1", "label": "Onboard new team members", "amount_paise": 3, "source_type": "sample_source_type_1", "source_id": "source__001" })] }), "cash_risk": ({ "risk_state": "sample_risk_state_1", "lowest_balance_paise": 3, "lowest_balance_date": "2026-01-15T10:00:00Z" }), "priority_actions": [({ "title": "Onboard new team members", "party": "sample_party_1", "amount_paise": 3, "due_date": "2026-01-15T10:00:00Z", "why_it_matters": "sample_why_it_matters_1", "action": "sample_action_1", "source_type": "sample_source_type_1", "source_id": "source__001" })], "recent_activity": [({ "date": "2026-01-15T10:00:00Z", "type": "sample_type_1", "description": "Sample description for record 1", "amount_paise": 3, "source_type": "sample_source_type_1", "source_id": "source__001" })], "calculated_at": "2026-01-15T10:00:00Z" })],
  ["GET", /^\/api\/expenses$/, (p, body) => []],
  ["GET", /^\/api\/alerts$/, (p, body) => ({ "items": __mockRows("alerts"), "next_cursor": "sample_next_cursor_1" })],
  ["POST", /^\/api\/shops$/, (p, body) => __sampleInsert("shops", body)],
  ["GET", /^\/api\/customer-payments\/([^\/]+)\/allocations$/, (p, body) => __mockRows("customer_payment_allocations", { customerPaymentId: p[0] })],
  ["GET", /^\/api\/supplier-payments\/([^\/]+)\/allocations$/, (p, body) => __mockRows("supplier_payment_allocations", { supplierPaymentId: p[0] })],
  ["GET", /^\/api\/customers\/([^\/]+)\/reminder-draft$/, (p, body) => ({ "language": "english", "text": "sample_text_1", "outstanding_paise": 3, "as_of_ist_date": "2026-01-15T10:00:00Z" })],
  ["POST", /^\/api\/shops\/([^\/]+)\/complete-setup$/, (p, body) => __mockRow("shops", p[0])],
  ["GET", /^\/api\/credit-transactions\/([^\/]+)$/, (p, body) => ({ "credit_transaction": __mockRow("credit_transactions", p[0]), "customer": ({ "id": "id_001", "name": "Jane Doe" }), "remaining_amount_paise": 3, "status": "active", "linked_payments": [({ "id": "id_001", "amount_paise": 3, "payment_date": "2026-01-15T10:00:00Z", "payment_method": "sample_payment_method_1" })] })],
  ["PATCH", /^\/api\/credit-transactions\/([^\/]+)$/, (p, body) => __sampleUpdate("credit_transactions", p[0], body)],
  ["DELETE", /^\/api\/credit-transactions\/([^\/]+)$/, (p, body) => __sampleDelete("credit_transactions", p[0])],
  ["POST", /^\/api\/alerts\/([^\/]+)\/take-action$/, (p, body) => __mockRow("alerts", p[0])],
  ["POST", /^\/api\/shops\/([^\/]+)\/sample-data$/, (p, body) => ({ "loaded": true, "customers_added": 3, "suppliers_added": 3, "records_added": 3 })],
  ["GET", /^\/api\/supplier-bills\/([^\/]+)$/, (p, body) => ({ "bill": __mockRow("supplier_bills", p[0]), "paid_amount_paise": 3, "remaining_amount_paise": 3, "payments": __mockRows("supplier_payments", { supplierBillId: p[0] }) })],
  ["PATCH", /^\/api\/supplier-bills\/([^\/]+)$/, (p, body) => __sampleUpdate("supplier_bills", p[0], body)],
  ["DELETE", /^\/api\/supplier-bills\/([^\/]+)$/, (p, body) => __sampleDelete("supplier_bills", p[0])],
  ["POST", /^\/api\/alerts\/([^\/]+)\/review$/, (p, body) => __mockRow("alerts", p[0])],
  ["GET", /^\/api\/customers\/([^\/]+)$/, (p, body) => ({ "customer": __mockRow("customers", p[0]), "outstanding_paise": 3, "overdue_paise": 3, "oldest_unpaid_date": "2026-01-15T10:00:00Z", "unpaid_credit_transactions": [({ "id": "id_001", "amount_paise": 3, "remaining_amount_paise": 3, "transaction_date": "2026-01-15T10:00:00Z", "expected_payment_date": "2026-01-15T10:00:00Z", "status": "active" })], "payment_history": [({ "id": "id_001", "amount_paise": 3, "payment_date": "2026-01-15T10:00:00Z", "payment_method": "sample_payment_method_1" })], "timeline": [({ "date": "2026-01-15T10:00:00Z", "type": "sample_type_1", "amount_paise": 3, "source_id": "source__001" })] })],
  ["PATCH", /^\/api\/customers\/([^\/]+)$/, (p, body) => __sampleUpdate("customers", p[0], body)],
  ["DELETE", /^\/api\/customers\/([^\/]+)$/, (p, body) => __sampleDelete("customers", p[0])],
  ["GET", /^\/api\/suppliers\/([^\/]+)$/, (p, body) => ({ "supplier": __mockRow("suppliers", p[0]), "payable_paise": 3, "nearest_unpaid_due_date": "2026-01-15T10:00:00Z", "bills": [({ "id": "id_001", "amount_paise": 3, "remaining_amount_paise": 3, "bill_date": "2026-01-15T10:00:00Z", "due_date": "2026-01-15T10:00:00Z", "status": "active" })], "payments": [({ "id": "id_001", "amount_paise": 3, "payment_date": "2026-01-15T10:00:00Z", "payment_method": "sample_payment_method_1", "supplier_bill_id": "supplier_bill__001" })], "activity": [({ "date": "2026-01-15T10:00:00Z", "type": "sample_type_1", "amount_paise": 3, "source_id": "source__001" })] })],
  ["PATCH", /^\/api\/suppliers\/([^\/]+)$/, (p, body) => __sampleUpdate("suppliers", p[0], body)],
  ["DELETE", /^\/api\/suppliers\/([^\/]+)$/, (p, body) => __sampleDelete("suppliers", p[0])],
  ["GET", /^\/api\/shops\/([^\/]+)$/, (p, body) => __mockRow("shops", p[0])],
  ["PATCH", /^\/api\/shops\/([^\/]+)$/, (p, body) => __sampleUpdate("shops", p[0], body)],
];

/** What `http()` returns in mock mode. Sign-in paths hand back the demo
 *  session @/lib/authContext uses. Every endpoint the API Layer designed
 *  answers in its own declared shape (`__NEXEN_MOCK_ROUTES__`), built from
 *  the same sample rows the database seed uses, and passed through the
 *  same `unwrap` a real answer gets — so a screen that works here reads
 *  the fields it will read against the real routes.
 *
 *  The `/me` rule is anchored to the END of the path: unanchored, it
 *  caught `/api/me/orders` and answered every "my ..." screen with the
 *  demo user. */
function __nexenMockResponse(url: string, init?: RequestInit): any {
  const method = (init?.method ?? 'GET').toUpperCase();
  const __path = String(url).split('?')[0].replace(/\/+$/, '') || '/';
  __sampleLoad();
  if (/\/(login|register|signup|sign-up|sign-in|signin)$/.test(__path)) {
    return { token: 'nexen-mock-token', user: __NEXEN_DEMO_USER__ };
  }
  if (/\/(logout|sign-out|signout)$/.test(__path)) return { ok: true };
  let __body: any = {};
  try { __body = init?.body ? JSON.parse(String(init.body)) : {}; } catch { __body = {}; }
  for (const [m, re, answer] of __NEXEN_MOCK_ROUTES__) {
    if (m !== method) continue;
    const hit = re.exec(__path);
    if (hit) return unwrap(answer(hit.slice(1).map(decodeURIComponent), __body));
  }
  if (method === 'GET' && /\/auth\/(me|session|user)$|^\/api\/(me|profile)$|\/users\/me$/.test(__path)) {
    return __NEXEN_DEMO_USER__;
  }
  // No designed answer: a write changes the rows its path names, kept for this
  // tab (`__sampleWrite`); else it echoes its body so optimistic UI still
  // renders. A read finds the rows its path names.
  if (method !== 'GET') {
    const written = __sampleWrite(method, __path, __body);
    if (written !== undefined || method === 'DELETE') return written;
  }
  if (method !== 'GET' && init?.body) return __body;
  const __segs = __path.split('/').filter(Boolean);
  for (let i = __segs.length - 1; i >= 0; i -= 1) {
    const rows = __NEXEN_MOCK_ROWS__[__segs[i]];
    if (!rows) continue;
    const isItem = i === __segs.length - 2;
    return isItem ? __mockRow(__segs[i], __segs[i + 1]) : rows;
  }
  return {};
}

import type { Alert } from '@/types/alert';
import type { CashMovement } from '@/types/cashmovement';
import type { CreditTransaction } from '@/types/credittransaction';
import type { Customer } from '@/types/customer';
import type { CustomerPayment } from '@/types/customerpayment';
import type { CustomerPaymentAllocation } from '@/types/customerpaymentallocation';
import type { Expens } from '@/types/expens';
import type { Shop } from '@/types/shop';
import type { Supplier } from '@/types/supplier';
import type { SupplierBill } from '@/types/supplierbill';
import type { SupplierPayment } from '@/types/supplierpayment';
import type { SupplierPaymentAllocation } from '@/types/supplierpaymentallocation';
import type { User } from '@/types/user';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function withQuery(
  url: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

// ONE envelope convention, applied here so nothing downstream has to think
// about it: route handlers return the entity WRAPPED — `{ task }`, `{ projects }`
// — matching the `{ error }` shape errors already use and leaving room for
// `{ data, meta }` later. This unwraps it, so hooks and pages only ever see
// entities.
//
// Without a single decision, some generated consumers unwrapped and some did
// not: `useTask` stored `{ task: {...} }` as the task itself while the page
// next to it got it right. Both were plausible readings of an unstated rule.
function unwrap(payload: any): any {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const keys = Object.keys(payload);
  // A single-key object whose key is not a known envelope field IS the
  // envelope. Anything else is already the entity — unwrapping a real
  // one-field entity would be worse than leaving a wrapper on.
  if (keys.length === 1 && !['error', 'message', 'ok'].includes(keys[0])) {
    return payload[keys[0]];
  }
  return payload;
}

async function http(url: string, init?: RequestInit): Promise<any> {
  // No database exists during the preview — answer locally.
  if (__NEXEN_IS_MOCK__) return __nexenMockResponse(url, init);
  // Unified-Next: same-origin relative URLs. Auth is DUAL — the login route
  // sets an httpOnly session cookie AND returns the JWT, which the login form
  // persists via @/lib/authToken. We attach it as `Authorization: Bearer` here
  // because the cookie is withheld inside the IDE preview's cross-site iframe;
  // `credentials: 'include'` keeps the cookie working in a normal browser too.
  const token = typeof window !== 'undefined' ? getToken() : null;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => res.statusText));
  }
  if (res.status === 204) return undefined;
  return unwrap(await res.json().catch(() => undefined));
}

export async function createAuthRegister(input: { name: string; email: string; password: string }): Promise<{ id: string; name: string; email: string; shop_id: string | null }> {
  return http(`/api/auth/register`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthLogin(input: { email: string; password: string }): Promise<{ user: { id: string; name: string; email: string }; shop_id: string | null }> {
  return http(`/api/auth/login`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthLogout(input: Record<string, unknown>): Promise<any> {
  return http(`/api/auth/logout`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAuthMe(query?: Record<string, string | number | boolean | undefined>): Promise<{ user: { id: string; name: string; email: string; last_login_at: string | null }; shop: { id: string; shop_name: string; interface_language: string; setup_completed_at: string | null } | null }> {
  return http(withQuery(`/api/auth/me`, query));
}
export async function updateAuthMe(input: Partial<Pick<User, 'name' | 'email'>>): Promise<any> {
  return http(`/api/auth/me`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createAuthChangePassword(input: { current_password: string; new_password: string }): Promise<any> {
  return http(`/api/auth/change-password`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthForgotPassword(input: { email: string }): Promise<{ message: string }> {
  return http(`/api/auth/forgot-password`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthResetPassword(input: { token: string; password: string }): Promise<any> {
  return http(`/api/auth/reset-password`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createShop(input: Partial<Omit<Shop, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Shop> {
  return http(`/api/shops`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getShopById(shopId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Shop> {
  return http(withQuery(`/api/shops/${shopId}`, query));
}
export async function updateShop(shopId: string, input: Partial<Omit<Shop, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Shop> {
  return http(`/api/shops/${shopId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createShopCompleteSetup(shopId: string, input: Record<string, unknown>): Promise<Shop> {
  return http(`/api/shops/${shopId}/complete-setup`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createShopSampleData(shopId: string, input: Record<string, unknown>): Promise<{ loaded: boolean; customers_added: number; suppliers_added: number; records_added: number }> {
  return http(`/api/shops/${shopId}/sample-data`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getCustomers(query?: { q?: string; filter?: 'all' | 'outstanding' | 'overdue'; sort?: 'highest_outstanding' | 'oldest_due' | 'name'; page?: number; limit?: number }): Promise<{ items: Array<{ id: string; name: string; phone_number: string | null; outstanding_paise: number; overdue_paise: number; oldest_unpaid_date: string | null; due_status: 'clear' | 'partial' | 'overdue' }>; total: number }> {
  return http(withQuery(`/api/customers`, query));
}
export async function createCustomer(input: Partial<Omit<Customer, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Customer> {
  return http(`/api/customers`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getCustomerById(customerId: string, query?: Record<string, string | number | boolean | undefined>): Promise<{ customer: Customer; outstanding_paise: number; overdue_paise: number; oldest_unpaid_date: string | null; unpaid_credit_transactions: Array<{ id: string; amount_paise: number; remaining_amount_paise: number; transaction_date: string; expected_payment_date: string | null; status: string }>; payment_history: Array<{ id: string; amount_paise: number; payment_date: string; payment_method: string }>; timeline: Array<{ date: string; type: string; amount_paise: number; source_id: string }> }> {
  return http(withQuery(`/api/customers/${customerId}`, query));
}
export async function updateCustomer(customerId: string, input: Partial<Omit<Customer, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Customer> {
  return http(`/api/customers/${customerId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteCustomer(customerId: string): Promise<void> {
  return http(`/api/customers/${customerId}`, { method: 'DELETE' });
}
export async function getCustomerReminderDraft(customerId: string, query?: { language?: 'english' | 'hindi' }): Promise<{ language: 'english' | 'hindi'; text: string; outstanding_paise: number; as_of_ist_date: string }> {
  return http(withQuery(`/api/customers/${customerId}/reminder-draft`, query));
}
export async function getCreditTransactions(query?: { customer_id?: string; status?: 'unpaid' | 'partially_paid' | 'paid'; expected?: 'any' | 'overdue' | 'none'; page?: number; limit?: number }): Promise<{ items: Array<{ id: string; customer_id: string; customer_name: string; amount_paise: number; remaining_amount_paise: number; transaction_date: string; expected_payment_date: string | null; description: string | null; status: string }>; total: number }> {
  return http(withQuery(`/api/credit-transactions`, query));
}
export async function createCreditTransaction(input: Partial<Omit<CreditTransaction, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<CreditTransaction> {
  return http(`/api/credit-transactions`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getCreditTransactionById(creditTransactionId: string, query?: Record<string, string | number | boolean | undefined>): Promise<{ credit_transaction: CreditTransaction; customer: { id: string; name: string }; remaining_amount_paise: number; status: string; linked_payments: Array<{ id: string; amount_paise: number; payment_date: string; payment_method: string }> }> {
  return http(withQuery(`/api/credit-transactions/${creditTransactionId}`, query));
}
export async function updateCreditTransaction(creditTransactionId: string, input: Partial<Omit<CreditTransaction, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<CreditTransaction> {
  return http(`/api/credit-transactions/${creditTransactionId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteCreditTransaction(creditTransactionId: string): Promise<void> {
  return http(`/api/credit-transactions/${creditTransactionId}`, { method: 'DELETE' });
}
export async function getSuppliers(query?: { q?: string; filter?: 'all' | 'overdue'; sort?: 'highest_payable' | 'nearest_due' | 'name'; page?: number; limit?: number }): Promise<{ items: Array<{ id: string; name: string; phone_number: string | null; payable_paise: number; nearest_unpaid_due_date: string | null; is_overdue: boolean }>; total: number }> {
  return http(withQuery(`/api/suppliers`, query));
}
export async function createSupplier(input: Partial<Omit<Supplier, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Supplier> {
  return http(`/api/suppliers`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getSupplierById(supplierId: string, query?: Record<string, string | number | boolean | undefined>): Promise<{ supplier: Supplier; payable_paise: number; nearest_unpaid_due_date: string | null; bills: Array<{ id: string; amount_paise: number; remaining_amount_paise: number; bill_date: string; due_date: string; status: string }>; payments: Array<{ id: string; amount_paise: number; payment_date: string; payment_method: string; supplier_bill_id: string }>; activity: Array<{ date: string; type: string; amount_paise: number; source_id: string }> }> {
  return http(withQuery(`/api/suppliers/${supplierId}`, query));
}
export async function updateSupplier(supplierId: string, input: Partial<Omit<Supplier, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Supplier> {
  return http(`/api/suppliers/${supplierId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteSupplier(supplierId: string): Promise<void> {
  return http(`/api/suppliers/${supplierId}`, { method: 'DELETE' });
}
export async function getDashboard(query?: Record<string, string | number | boolean | undefined>): Promise<{ shop_name: string; today_ist: string; available_cash_paise: number; customer_outstanding_paise: number; overdue_customer_paise: number; supplier_outstanding_paise: number; next_7_days: { incoming_paise: number; outgoing_paise: number; schedule: Array<{ date: string; kind: string; label: string; amount_paise: number; source_type: string; source_id: string }> }; cash_risk: { risk_state: string; lowest_balance_paise: number; lowest_balance_date: string | null }; priority_actions: Array<{ title: string; party: string | null; amount_paise: number; due_date: string | null; why_it_matters: string; action: string; source_type: string; source_id: string }>; recent_activity: Array<{ date: string; type: string; description: string; amount_paise: number; source_type: string; source_id: string }>; calculated_at: string }> {
  return http(withQuery(`/api/dashboard`, query));
}
export async function getAvailableCash(query?: { limit?: number }): Promise<{ available_paise: number; cash_in_hand_paise: number; bank_upi_paise: number; opening_cash_paise: number; opening_bank_upi_paise: number; recent_movements: Array<{ id: string; direction: 'inflow' | 'outflow'; amount_paise: number; payment_method: string; movement_date: string; source_type: string; source_id: string }>; calculated_at: string }> {
  return http(withQuery(`/api/available-cash`, query));
}
export async function getCashForecast(query?: { period?: '30' | '60' | '90' }): Promise<{ period_days: number; starting_available_paise: number; lowest_balance_paise: number; lowest_balance_date: string; expected_inflows_paise: number; scheduled_outflows_paise: number; overdue_excluded_paise: number; days: Array<{ date: string; inflow_paise: number; outflow_paise: number; closing_balance_paise: number }>; events: Array<{ date: string; kind: 'expected_collection' | 'supplier_bill_due' | 'expense_due'; label: string; amount_paise: number; source_type: string; source_id: string }>; assumptions: string[]; calculated_at: string }> {
  return http(withQuery(`/api/cash-forecast`, query));
}
export async function getCashSurvivalRadar(query?: { period?: '30' | '60' | '90' }): Promise<{ risk_state: 'normal' | 'watch' | 'shortage'; safety_threshold_paise: number; lowest_balance_paise: number; lowest_balance_date: string; shortfall_paise: number; curve: Array<{ date: string; closing_balance_paise: number }>; drivers: { collections: Array<{ credit_transaction_id: string; customer_name: string; amount_paise: number; expected_payment_date: string }>; obligations: Array<{ source_type: string; source_id: string; label: string; amount_paise: number; due_date: string }> }; calculated_at: string }> {
  return http(withQuery(`/api/cash-survival-radar`, query));
}
export async function getWhatIfScenario(query?: { credit_transaction_id?: string; delay_days?: number }): Promise<any> {
  return http(withQuery(`/api/what-if-scenario`, query));
}
export async function getCustomerPayments(query?: { customer_id?: string; credit_transaction_id?: string; page?: number }): Promise<CustomerPayment[]> {
  return http(withQuery(`/api/customer-payments`, query));
}
export async function getCustomerPaymentPreview(query?: { customer_id?: string; credit_transaction_id?: string; amount_paise?: number }): Promise<{ outstanding_before_paise: number; received_paise: number; outstanding_after_paise: number; allocations: Array<{ credit_transaction_id: string; amount_paise: number }> }> {
  return http(withQuery(`/api/customer-payments/preview`, query));
}
export async function createCustomerPayment(input: Partial<Omit<CustomerPayment, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<CustomerPayment> {
  return http(`/api/customer-payments`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getSupplierBills(query?: { status?: 'unpaid' | 'partially_paid' | 'paid' | 'overdue'; supplier_id?: string; due_within_days?: number; page?: number }): Promise<Array<{ id: string; supplier_id: string; supplier_name: string; bill_date: string; due_date: string; amount_paise: number; remaining_amount_paise: number; status: string; overdue: boolean }>> {
  return http(withQuery(`/api/supplier-bills`, query));
}
export async function createSupplierBill(input: Partial<Omit<SupplierBill, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SupplierBill> {
  return http(`/api/supplier-bills`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getSupplierBillById(supplierBillId: string, query?: Record<string, string | number | boolean | undefined>): Promise<{ bill: SupplierBill; paid_amount_paise: number; remaining_amount_paise: number; payments: SupplierPayment[] }> {
  return http(withQuery(`/api/supplier-bills/${supplierBillId}`, query));
}
export async function updateSupplierBill(supplierBillId: string, input: Partial<Omit<SupplierBill, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SupplierBill> {
  return http(`/api/supplier-bills/${supplierBillId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteSupplierBill(supplierBillId: string): Promise<void> {
  return http(`/api/supplier-bills/${supplierBillId}`, { method: 'DELETE' });
}
export async function getSupplierPayments(query?: { supplier_id?: string; supplier_bill_id?: string; page?: number }): Promise<SupplierPayment[]> {
  return http(withQuery(`/api/supplier-payments`, query));
}
export async function getSupplierPaymentPreview(query?: { supplier_id?: string; supplier_bill_id?: string; amount_paise?: number }): Promise<{ supplier_bill_id: string; remaining_before_paise: number; paid_paise: number; remaining_after_paise: number; allocations: Array<{ supplier_bill_id: string; amount_paise: number }> }> {
  return http(withQuery(`/api/supplier-payments/preview`, query));
}
export async function createSupplierPayment(input: Partial<Omit<SupplierPayment, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SupplierPayment> {
  return http(`/api/supplier-payments`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getExpenses(query?: { category?: 'rent' | 'electricity' | 'wages' | 'transport' | 'other'; status?: 'unpaid' | 'paid' | 'cancelled'; from?: string; to?: string; page?: number }): Promise<Expens[]> {
  return http(withQuery(`/api/expenses`, query));
}
export async function createExpens(input: Partial<Omit<Expens, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Expens> {
  return http(`/api/expenses`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getExpensById(expenseId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Expens> {
  return http(withQuery(`/api/expenses/${expenseId}`, query));
}
export async function updateExpens(expenseId: string, input: Partial<Omit<Expens, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Expens> {
  return http(`/api/expenses/${expenseId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createExpensMarkPaid(expenseId: string, input: { payment_date: string }): Promise<any> {
  return http(`/api/expenses/${expenseId}/mark-paid`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createExpensCancel(expenseId: string, input: Record<string, unknown>): Promise<any> {
  return http(`/api/expenses/${expenseId}/cancel`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getCashMovements(query?: { direction?: 'inflow' | 'outflow'; payment_method?: 'cash' | 'upi' | 'bank'; from?: string; to?: string; limit?: number; cursor?: string }): Promise<{ items: CashMovement[]; next_cursor: string | null }> {
  return http(withQuery(`/api/cash-movements`, query));
}
export async function getAlerts(query?: { filter_category?: 'collections' | 'supplier' | 'expenses' | 'cash_risk'; status?: 'new' | 'reviewed' | 'action_taken' | 'resolved'; limit?: number; cursor?: string }): Promise<{ items: Alert[]; next_cursor: string | null }> {
  return http(withQuery(`/api/alerts`, query));
}
export async function createAlertReview(alertId: string, input: Record<string, unknown>): Promise<Alert> {
  return http(`/api/alerts/${alertId}/review`, { method: 'POST', body: JSON.stringify(input) });
}
// max 500 chars
export async function createAlertTakeAction(alertId: string, input: { action_note?: string }): Promise<Alert> {
  return http(`/api/alerts/${alertId}/take-action`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getCustomerPaymentAllocations(customerPaymentId: string, query?: Record<string, string | number | boolean | undefined>): Promise<CustomerPaymentAllocation[]> {
  return http(withQuery(`/api/customer-payments/${customerPaymentId}/allocations`, query));
}
export async function getSupplierPaymentAllocations(supplierPaymentId: string, query?: Record<string, string | number | boolean | undefined>): Promise<SupplierPaymentAllocation[]> {
  return http(withQuery(`/api/supplier-payments/${supplierPaymentId}/allocations`, query));
}
export async function createAlertSync(input: Record<string, unknown>): Promise<any> {
  return http(`/api/alerts/sync`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAlertById(alertId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Alert> {
  return http(withQuery(`/api/alerts/${alertId}`, query));
}


// --- Added by hand (not part of the generated surface): payment reversal and the activity log. ---

export async function createCustomerPaymentReverse(customerPaymentId: string, input: { reason: string }): Promise<CustomerPayment> {
  return http(`/api/customer-payments/${customerPaymentId}/reverse`, { method: 'POST', body: JSON.stringify(input) });
}

export async function createSupplierPaymentReverse(supplierPaymentId: string, input: { reason: string }): Promise<SupplierPayment> {
  return http(`/api/supplier-payments/${supplierPaymentId}/reverse`, { method: 'POST', body: JSON.stringify(input) });
}

export interface AuditEventItem {
  id: string;
  created_at: string;
  actor_name: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: { before?: Record<string, unknown>; after?: Record<string, unknown>; reason?: string; amountPaise?: number } | null;
}

export async function getAuditEvents(query?: { limit?: number; cursor?: string }): Promise<{ items: AuditEventItem[]; next_cursor: string | null }> {
  return http(withQuery(`/api/audit-events`, query));
}
