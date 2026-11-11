import type { ZodType } from "zod";
import * as validators from "../../src/validators";
import {
  errorResponses,
  jsonResponse,
  pathParameter,
  queryParameters,
  ref,
  type JsonSchema,
  type Parameter,
} from "./schema";

export type OperationDefinition = {
  summary: string;
  description?: string;
  tags: string[];
  auth: boolean;
  parameters?: Parameter[];
  requestBody?: {
    schema: ZodType;
    required?: boolean;
  };
  responses: Record<string, JsonSchema>;
};

const dateTimeParameter: JsonSchema = { type: "string", format: "date-time" };

function idParameter(description: string): Parameter {
  return pathParameter("id", description);
}

function csvResponse(description: string): JsonSchema {
  return {
    description,
    content: {
      "text/csv": {
        schema: { type: "string" },
      },
    },
  };
}

/**
 * One entry per mounted route, keyed by the Hono route as
 * `<METHOD> <path>`. The generator refuses to run when this map and the live
 * `app.routes` list disagree in either direction.
 */
export const OPERATIONS: Record<string, OperationDefinition> = {
  "GET /auth/me": {
    summary: "Get the current authenticated user",
    tags: ["auth"],
    auth: true,
    responses: {
      200: jsonResponse("Authenticated user", ref("AuthMe")),
      ...errorResponses(401),
    },
  },
  "POST /auth/logout": {
    summary: "Revoke the current session",
    tags: ["auth"],
    auth: true,
    responses: {
      200: jsonResponse("Session revoked", ref("Success")),
      ...errorResponses(401),
    },
  },
  "GET /api/auth/redirect/google": {
    summary: "Start a direct-navigation Google sign-in",
    description:
      "Browser entry point that sets the OAuth state cookie same-site and redirects to Google.",
    tags: ["auth"],
    auth: false,
    parameters: [
      {
        name: "callbackURL",
        in: "query",
        required: false,
        description: "Where to send the browser after sign-in.",
        schema: { type: "string", format: "uri" },
      },
    ],
    responses: {
      302: {
        description: "Redirect to the Google OAuth consent screen",
        headers: {
          Location: {
            description: "Google OAuth URL",
            schema: { type: "string", format: "uri" },
          },
        },
      },
      ...errorResponses(500),
    },
  },
  "ALL /api/auth/*": {
    summary: "Better Auth request handler",
    description:
      "Pass-through for all Better Auth endpoints (OAuth callback, session, sign-out). Every HTTP method is handled.",
    tags: ["auth"],
    auth: false,
    responses: {
      200: { description: "Response produced by the Better Auth handler" },
    },
  },

  "GET /audit-logs": {
    summary: "List the caller's audit entries",
    tags: ["audit-logs"],
    auth: true,
    parameters: queryParameters(validators.auditQuerySchema, {
      from: dateTimeParameter,
      to: dateTimeParameter,
    }),
    responses: {
      200: jsonResponse("Paginated audit entries", ref("AuditLogPage")),
      ...errorResponses(400, 401),
    },
  },
  "GET /audit-logs/:id": {
    summary: "Get one audit entry",
    tags: ["audit-logs"],
    auth: true,
    parameters: [idParameter("Audit entry id")],
    responses: {
      200: jsonResponse("Audit entry", ref("AuditLog")),
      ...errorResponses(401, 404),
    },
  },

  "GET /customers": {
    summary: "List non-deleted customers",
    tags: ["customers"],
    auth: true,
    responses: {
      200: jsonResponse(
        "Array of customers",
        { type: "array", items: ref("Customer") },
      ),
      ...errorResponses(401),
    },
  },
  "GET /customers/:id": {
    summary: "Get a single customer",
    tags: ["customers"],
    auth: true,
    parameters: [idParameter("Customer id")],
    responses: {
      200: jsonResponse("Customer", ref("Customer")),
      ...errorResponses(401, 404),
    },
  },
  "POST /customers": {
    summary: "Create a customer",
    description:
      "A client-supplied id makes the request idempotent for offline replays.",
    tags: ["customers"],
    auth: true,
    requestBody: { schema: validators.createCustomerSchema },
    responses: {
      201: jsonResponse("Customer created or replayed", ref("Customer")),
      ...errorResponses(400, 401, 404),
    },
  },
  "PUT /customers/:id": {
    summary: "Update a customer",
    tags: ["customers"],
    auth: true,
    parameters: [idParameter("Customer id")],
    requestBody: { schema: validators.updateCustomerSchema },
    responses: {
      200: jsonResponse("Updated customer", ref("Customer")),
      ...errorResponses(400, 401, 404),
    },
  },
  "DELETE /customers/:id": {
    summary: "Soft-delete a customer",
    tags: ["customers"],
    auth: true,
    parameters: [idParameter("Customer id")],
    responses: {
      200: jsonResponse("Customer deleted", ref("Success")),
      ...errorResponses(401, 404),
    },
  },

  "GET /transactions/customers/:id/transactions": {
    summary: "List a customer's transactions",
    description:
      "Paginated, newest first, with a running balance computed over the filtered set.",
    tags: ["transactions"],
    auth: true,
    parameters: [
      idParameter("Customer id"),
      ...queryParameters(validators.transactionListQuerySchema, {
        start: dateTimeParameter,
        end: dateTimeParameter,
      }),
    ],
    responses: {
      200: jsonResponse("Paginated transactions", ref("TransactionPage")),
      ...errorResponses(400, 401),
    },
  },
  "GET /transactions/:id": {
    summary: "Get a single transaction",
    tags: ["transactions"],
    auth: true,
    parameters: [idParameter("Transaction id")],
    responses: {
      200: jsonResponse("Transaction", ref("Transaction")),
      ...errorResponses(401, 404),
    },
  },
  "POST /transactions": {
    summary: "Create a transaction",
    description:
      "A client-supplied id makes the request idempotent for offline replays.",
    tags: ["transactions"],
    auth: true,
    requestBody: { schema: validators.createTransactionSchema },
    responses: {
      201: jsonResponse("Transaction created or replayed", ref("Transaction")),
      ...errorResponses(400, 401, 404),
    },
  },
  "PUT /transactions/:id": {
    summary: "Update a transaction",
    tags: ["transactions"],
    auth: true,
    parameters: [idParameter("Transaction id")],
    requestBody: { schema: validators.updateTransactionSchema },
    responses: {
      200: jsonResponse("Updated transaction", ref("Transaction")),
      ...errorResponses(400, 401, 404),
    },
  },
  "DELETE /transactions/:id": {
    summary: "Soft-delete a transaction",
    tags: ["transactions"],
    auth: true,
    parameters: [idParameter("Transaction id")],
    responses: {
      200: jsonResponse("Transaction deleted", ref("Success")),
      ...errorResponses(401, 404),
    },
  },

  "GET /dashboard/metrics": {
    summary: "Get dashboard totals",
    tags: ["dashboard"],
    auth: true,
    responses: {
      200: jsonResponse("Dashboard metrics", ref("DashboardMetrics")),
      ...errorResponses(401),
    },
  },
  "GET /dashboard/recent-transactions": {
    summary: "Get the five most recent transactions",
    tags: ["dashboard"],
    auth: true,
    responses: {
      200: jsonResponse(
        "Recent transactions",
        { type: "array", items: ref("Transaction") },
      ),
      ...errorResponses(401),
    },
  },
  "GET /dashboard/analytics": {
    summary: "Get 12-month trend, top debtors, and aging",
    tags: ["dashboard"],
    auth: true,
    responses: {
      200: jsonResponse("Dashboard analytics", ref("Analytics")),
      ...errorResponses(401),
    },
  },

  "GET /books": {
    summary: "Get the caller's default book",
    description: "Creates the default book on first use.",
    tags: ["books"],
    auth: true,
    responses: {
      200: jsonResponse("Default book", ref("Book")),
      ...errorResponses(401),
    },
  },

  "GET /exports/customers.csv": {
    summary: "Export customers as CSV",
    description: "Excludes deleted and sample rows.",
    tags: ["exports"],
    auth: true,
    responses: {
      200: csvResponse("CSV attachment of customers"),
      ...errorResponses(401),
    },
  },
  "GET /exports/transactions.csv": {
    summary: "Export transactions as CSV",
    description: "Excludes deleted and sample rows.",
    tags: ["exports"],
    auth: true,
    responses: {
      200: csvResponse("CSV attachment of transactions"),
      ...errorResponses(401),
    },
  },

  "GET /account/export": {
    summary: "Export the full account archive",
    description: "Includes soft-deleted rows; excludes sample rows.",
    tags: ["account"],
    auth: true,
    responses: {
      200: jsonResponse("Complete account archive", ref("AccountArchive")),
      ...errorResponses(401),
    },
  },
  "DELETE /account": {
    summary: "Delete the account and its data",
    description:
      "Requires the exact confirmation body and is irreversible. Audit entries survive.",
    tags: ["account"],
    auth: true,
    requestBody: { schema: validators.deleteAccountSchema },
    responses: {
      200: jsonResponse("Account deleted", ref("Success")),
      ...errorResponses(400, 401),
    },
  },

  "GET /statements/customers/:id": {
    summary: "Get a customer statement",
    description:
      "Computes opening/closing balances and per-entry running balances for an optional date range.",
    tags: ["statements"],
    auth: true,
    parameters: [
      idParameter("Customer id"),
      ...queryParameters(validators.statementQuerySchema, {
        start: dateTimeParameter,
        end: dateTimeParameter,
      }),
    ],
    responses: {
      200: jsonResponse("Statement model", ref("Statement")),
      ...errorResponses(400, 401, 404),
    },
  },

  "GET /settings": {
    summary: "Get the caller's settings",
    tags: ["settings"],
    auth: true,
    responses: {
      200: jsonResponse("UPI and onboarding settings", ref("Settings")),
      ...errorResponses(401),
    },
  },
  "PUT /settings": {
    summary: "Update the caller's settings",
    description: "Partial update; null clears a field.",
    tags: ["settings"],
    auth: true,
    requestBody: { schema: validators.settingsUpdateSchema },
    responses: {
      200: jsonResponse("Updated settings", ref("Settings")),
      ...errorResponses(400, 401),
    },
  },

  "GET /collection": {
    summary: "List customers with an outstanding balance",
    tags: ["collection"],
    auth: true,
    parameters: queryParameters(validators.collectionQuerySchema),
    responses: {
      200: jsonResponse("Outstanding receivables", ref("CollectionResponse")),
      ...errorResponses(400, 401),
    },
  },

  "POST /sample-data": {
    summary: "Seed sample customers and transactions",
    tags: ["sample-data"],
    auth: true,
    responses: {
      201: jsonResponse("Created sample records", ref("SampleDataResult")),
      ...errorResponses(401),
    },
  },
  "DELETE /sample-data": {
    summary: "Remove only the sample records",
    tags: ["sample-data"],
    auth: true,
    responses: {
      200: jsonResponse("Sample records removed", ref("Success")),
      ...errorResponses(401),
    },
  },
};

export const OPERATION_KEYS = Object.keys(OPERATIONS);
