import type { JsonSchema } from "./schema";

const uuid: JsonSchema = { type: "string", format: "uuid" };
const dateTime: JsonSchema = { type: "string", format: "date-time" };
const nullable = (schema: JsonSchema): JsonSchema => ({
  ...schema,
  nullable: true,
});
const arrayOf = (items: JsonSchema): JsonSchema => ({
  type: "array",
  items,
});
const ref = (name: string): JsonSchema => ({
  $ref: `#/components/schemas/${name}`,
});
const object = (
  properties: Record<string, JsonSchema>,
  required?: string[],
): JsonSchema => ({
  type: "object",
  properties,
  ...(required ? { required } : {}),
});

const transactionType: JsonSchema = { type: "string", enum: ["credit", "debit"] };
const paymentMethod: JsonSchema = {
  type: "string",
  enum: ["cash", "upi", "other"],
};

const customer = object(
  {
    id: uuid,
    userId: { type: "string" },
    bookId: uuid,
    name: { type: "string" },
    phone: { type: "string" },
    isSample: { type: "boolean" },
    createdAt: dateTime,
    updatedAt: dateTime,
    deletedAt: nullable(dateTime),
  },
  [
    "id",
    "userId",
    "bookId",
    "name",
    "phone",
    "isSample",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ],
);

const transaction = object(
  {
    id: uuid,
    userId: { type: "string" },
    bookId: uuid,
    customerId: uuid,
    amount: { type: "integer", description: "Whole currency units (rupees)" },
    type: transactionType,
    paymentMethod: nullable(paymentMethod),
    note: nullable({ type: "string" }),
    isSample: { type: "boolean" },
    createdAt: dateTime,
    updatedAt: dateTime,
    deletedAt: nullable(dateTime),
  },
  [
    "id",
    "userId",
    "bookId",
    "customerId",
    "amount",
    "type",
    "paymentMethod",
    "note",
    "isSample",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ],
);

export const MODELS: Record<string, JsonSchema> = {
  AccountArchive: object(
    {
      exportedAt: dateTime,
      user: object(
        {
          id: { type: "string" },
          email: { type: "string", format: "email" },
        },
        ["id", "email"],
      ),
      customers: arrayOf(ref("CustomerWithDeleted")),
      transactions: arrayOf(ref("TransactionWithDeleted")),
    },
    ["exportedAt", "user", "customers", "transactions"],
  ),
  AgingBuckets: object(
    {
      "0-30": { type: "integer" },
      "31-60": { type: "integer" },
      "60+": { type: "integer" },
    },
    ["0-30", "31-60", "60+"],
  ),
  Analytics: object(
    {
      trend: arrayOf(ref("AnalyticsTrendPoint")),
      topDebtors: arrayOf(ref("TopDebtor")),
      aging: ref("AgingBuckets"),
      totalReceivables: { type: "integer" },
    },
    ["trend", "topDebtors", "aging", "totalReceivables"],
  ),
  AnalyticsTrendPoint: object(
    {
      month: { type: "string", description: "UTC month key, YYYY-MM" },
      credit: { type: "integer" },
      debit: { type: "integer" },
    },
    ["month", "credit", "debit"],
  ),
  AuditLog: object(
    {
      id: uuid,
      actorUserId: nullable({ type: "string" }),
      action: { type: "string" },
      entityType: { type: "string" },
      entityId: nullable({ type: "string" }),
      metadata: nullable({ type: "object", additionalProperties: true }),
      ipAddress: nullable({ type: "string" }),
      userAgent: nullable({ type: "string" }),
      createdAt: dateTime,
    },
    [
      "id",
      "actorUserId",
      "action",
      "entityType",
      "entityId",
      "metadata",
      "ipAddress",
      "userAgent",
      "createdAt",
    ],
  ),
  AuditLogPage: object(
    {
      data: arrayOf(ref("AuditLog")),
      page: { type: "integer" },
      pageSize: { type: "integer" },
    },
    ["data", "page", "pageSize"],
  ),
  AuthMe: object(
    {
      id: { type: "string" },
      email: { type: "string", format: "email" },
      name: nullable({ type: "string" }),
      image: nullable({ type: "string" }),
    },
    ["id", "email", "name", "image"],
  ),
  Book: object(
    {
      id: uuid,
      userId: { type: "string" },
      name: { type: "string" },
      isDefault: { type: "boolean" },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
    ["id", "userId", "name", "isDefault", "createdAt", "updatedAt"],
  ),
  CollectionResponse: object(
    {
      data: arrayOf(ref("CollectionRow")),
      totalReceivables: { type: "integer" },
      sort: { type: "string", enum: ["amount", "age"] },
    },
    ["data", "totalReceivables", "sort"],
  ),
  CollectionRow: object(
    {
      customerId: uuid,
      name: { type: "string" },
      phone: { type: "string" },
      outstanding: { type: "integer" },
      oldestUnpaidCreditAt: nullable(dateTime),
      ageDays: nullable({ type: "integer" }),
    },
    [
      "customerId",
      "name",
      "phone",
      "outstanding",
      "oldestUnpaidCreditAt",
      "ageDays",
    ],
  ),
  Customer: customer,
  CustomerWithDeleted: {
    allOf: [
      ref("Customer"),
      object({ deleted: { type: "boolean" } }, ["deleted"]),
    ],
  },
  DashboardMetrics: object(
    {
      totalBalance: { type: "integer" },
      totalCustomers: { type: "integer" },
      monthlyNet: { type: "integer" },
    },
    ["totalBalance", "totalCustomers", "monthlyNet"],
  ),
  Error: object(
    {
      error: { type: "string" },
      details: {
        type: "object",
        additionalProperties: arrayOf({ type: "string" }),
      },
    },
    ["error"],
  ),
  SampleDataResult: object(
    {
      customers: arrayOf(ref("Customer")),
      transactions: arrayOf(ref("Transaction")),
    },
    ["customers", "transactions"],
  ),
  Settings: object(
    {
      upiId: nullable({ type: "string" }),
      payeeName: nullable({ type: "string" }),
      onboardingCompletedAt: nullable(dateTime),
      onboardingDismissedAt: nullable(dateTime),
    },
    [
      "upiId",
      "payeeName",
      "onboardingCompletedAt",
      "onboardingDismissedAt",
    ],
  ),
  Statement: object(
    {
      customer: object(
        {
          id: uuid,
          name: { type: "string" },
          phone: { type: "string" },
        },
        ["id", "name", "phone"],
      ),
      start: nullable({ type: "string" }),
      end: nullable({ type: "string" }),
      openingBalance: { type: "integer" },
      closingBalance: { type: "integer" },
      totalCredit: { type: "integer" },
      totalDebit: { type: "integer" },
      entries: arrayOf(ref("StatementEntry")),
    },
    [
      "customer",
      "start",
      "end",
      "openingBalance",
      "closingBalance",
      "totalCredit",
      "totalDebit",
      "entries",
    ],
  ),
  StatementEntry: object(
    {
      id: uuid,
      date: dateTime,
      type: transactionType,
      amount: { type: "integer" },
      paymentMethod: nullable(paymentMethod),
      note: nullable({ type: "string" }),
      runningBalance: { type: "integer" },
    },
    [
      "id",
      "date",
      "type",
      "amount",
      "paymentMethod",
      "note",
      "runningBalance",
    ],
  ),
  Success: object({ success: { type: "boolean" } }, ["success"]),
  TopDebtor: object(
    {
      customerId: uuid,
      name: { type: "string" },
      outstanding: { type: "integer" },
      ageDays: nullable({ type: "integer" }),
    },
    ["customerId", "name", "outstanding", "ageDays"],
  ),
  Transaction: transaction,
  TransactionPage: object(
    {
      data: arrayOf(ref("TransactionWithRunningBalance")),
      page: { type: "integer" },
      pageSize: { type: "integer" },
      total: { type: "integer" },
      totalCredit: { type: "integer" },
      totalDebit: { type: "integer" },
      totalAmount: { type: "integer" },
      start: nullable({ type: "string" }),
      end: nullable({ type: "string" }),
    },
    [
      "data",
      "page",
      "pageSize",
      "total",
      "totalCredit",
      "totalDebit",
      "totalAmount",
      "start",
      "end",
    ],
  ),
  TransactionWithDeleted: {
    allOf: [
      ref("Transaction"),
      object({ deleted: { type: "boolean" } }, ["deleted"]),
    ],
  },
  TransactionWithRunningBalance: {
    allOf: [
      ref("Transaction"),
      object({ runningBalance: { type: "integer" } }, ["runningBalance"]),
    ],
  },
};

export function modelNames(): string[] {
  return Object.keys(MODELS).sort();
}
