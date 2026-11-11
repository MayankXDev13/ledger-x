import { describe, expect, test } from "bun:test";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { MODELS } from "./models";
import type { JsonSchema } from "./schema";

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

/**
 * OpenAPI 3.0 uses `nullable: true`, which is not a JSON Schema keyword.
 * Convert the models to draft-07 (resolving local `$ref`s) so Ajv can validate
 * the same shapes the spec publishes.
 */
function toJsonSchema(
  schema: JsonSchema,
  stack = new Set<string>(),
): unknown {
  if (typeof schema !== "object" || schema === null) return schema;
  if (Array.isArray(schema)) {
    return schema.map((entry) => toJsonSchema(entry as JsonSchema, stack));
  }

  if (typeof schema.$ref === "string") {
    const name = schema.$ref.split("/").pop();
    if (!name || !MODELS[name]) {
      throw new Error(`Unknown model reference: ${schema.$ref}`);
    }
    if (stack.has(name)) throw new Error(`Cyclic model reference: ${name}`);
    return toJsonSchema(MODELS[name], new Set([...stack, name]));
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "nullable") continue;
    out[key] = toJsonSchema(value as JsonSchema, stack);
  }

  if (schema.nullable === true) {
    return { anyOf: [out, { type: "null" }] };
  }

  return out;
}

const uuid = "6f9619ff-8b86-d011-b42d-00cf4fc964ff";
const otherUuid = "7f9619ff-8b86-d011-b42d-00cf4fc964ff";
const createdAt = "2026-11-01T10:00:00.000Z";
const updatedAt = "2026-11-02T11:00:00.000Z";

const customer = {
  id: uuid,
  userId: "user-1",
  bookId: otherUuid,
  name: "Ramesh Kirana",
  phone: "9000000001",
  isSample: false,
  createdAt,
  updatedAt,
  deletedAt: null,
};

const transaction = {
  id: uuid,
  userId: "user-1",
  bookId: otherUuid,
  customerId: otherUuid,
  amount: 25000,
  type: "credit",
  paymentMethod: null,
  note: "Opening balance",
  isSample: false,
  createdAt,
  updatedAt,
  deletedAt: null,
};

const FIXTURES: Record<string, unknown> = {
  AccountArchive: {
    exportedAt: createdAt,
    user: { id: "user-1", email: "owner@example.com" },
    customers: [{ ...customer, deleted: false }],
    transactions: [{ ...transaction, deleted: false }],
  },
  AgingBuckets: { "0-30": 1000, "31-60": 2000, "60+": 3000 },
  Analytics: {
    trend: [{ month: "2026-11", credit: 1000, debit: 500 }],
    topDebtors: [
      { customerId: uuid, name: "Ramesh", outstanding: 500, ageDays: 12 },
    ],
    aging: { "0-30": 500, "31-60": 0, "60+": 0 },
    totalReceivables: 500,
  },
  AnalyticsTrendPoint: { month: "2026-11", credit: 1000, debit: 500 },
  AuditLog: {
    id: uuid,
    actorUserId: "user-1",
    action: "customer.create",
    entityType: "customer",
    entityId: otherUuid,
    metadata: { source: "web" },
    ipAddress: null,
    userAgent: null,
    createdAt,
  },
  AuditLogPage: {
    data: [
      {
        id: uuid,
        actorUserId: null,
        action: "auth.logout",
        entityType: "session",
        entityId: null,
        metadata: null,
        ipAddress: null,
        userAgent: null,
        createdAt,
      },
    ],
    page: 1,
    pageSize: 20,
  },
  AuthMe: {
    id: "user-1",
    email: "owner@example.com",
    name: null,
    image: null,
  },
  Book: {
    id: uuid,
    userId: "user-1",
    name: "My Ledger",
    isDefault: true,
    createdAt,
    updatedAt,
  },
  CollectionResponse: {
    data: [
      {
        customerId: uuid,
        name: "Ramesh",
        phone: "9000000001",
        outstanding: 500,
        oldestUnpaidCreditAt: createdAt,
        ageDays: 12,
      },
    ],
    totalReceivables: 500,
    sort: "amount",
  },
  CollectionRow: {
    customerId: uuid,
    name: "Ramesh",
    phone: "9000000001",
    outstanding: 500,
    oldestUnpaidCreditAt: null,
    ageDays: null,
  },
  Customer: customer,
  CustomerWithDeleted: { ...customer, deleted: true },
  DashboardMetrics: {
    totalBalance: 5000,
    totalCustomers: 3,
    monthlyNet: 1200,
  },
  Error: {
    error: "Validation failed",
    details: { name: ["Name is required"] },
  },
  SampleDataResult: {
    customers: [customer],
    transactions: [transaction],
  },
  FeatureFlagsResponse: {
    flags: { collection: true, upi_collection: false },
  },
  Settings: {
    upiId: "shop@upi",
    payeeName: "Ramesh Kirana",
    onboardingCompletedAt: createdAt,
    onboardingDismissedAt: null,
  },
  Statement: {
    customer: { id: uuid, name: "Ramesh", phone: "9000000001" },
    start: null,
    end: null,
    openingBalance: 0,
    closingBalance: 25000,
    totalCredit: 25000,
    totalDebit: 0,
    entries: [
      {
        id: otherUuid,
        date: createdAt,
        type: "credit",
        amount: 25000,
        paymentMethod: null,
        note: null,
        runningBalance: 25000,
      },
    ],
  },
  StatementEntry: {
    id: uuid,
    date: createdAt,
    type: "debit",
    amount: 5000,
    paymentMethod: "upi",
    note: "Paid by UPI",
    runningBalance: 20000,
  },
  Success: { success: true },
  TopDebtor: {
    customerId: uuid,
    name: "Ramesh",
    outstanding: 500,
    ageDays: null,
  },
  Transaction: transaction,
  TransactionPage: {
    data: [{ ...transaction, runningBalance: 25000 }],
    page: 1,
    pageSize: 10,
    total: 1,
    totalCredit: 25000,
    totalDebit: 0,
    totalAmount: 25000,
    start: null,
    end: null,
  },
  TransactionWithDeleted: { ...transaction, deleted: true },
  TransactionWithRunningBalance: { ...transaction, runningBalance: 25000 },
};

describe("response models", () => {
  test("every model has a fixture", () => {
    expect(Object.keys(FIXTURES).sort()).toEqual(Object.keys(MODELS).sort());
  });

  for (const name of Object.keys(MODELS)) {
    test(`accepts a representative ${name}`, () => {
      const validate = ajv.compile(toJsonSchema(MODELS[name]) as never);
      const valid = validate(FIXTURES[name]);
      if (!valid) {
        throw new Error(
          `${name}: ${ajv.errorsText(validate.errors, { separator: "\n" })}`,
        );
      }
      expect(valid).toBe(true);
    });
  }
});
