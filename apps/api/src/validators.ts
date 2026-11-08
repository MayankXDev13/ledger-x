import { z } from "zod";

export const paymentMethodSchema = z.enum(["cash", "upi", "other"]);

export const createCustomerSchema = z.object({
  id: z.string().uuid("id must be a valid UUID").optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
});

export const createTransactionSchema = z.object({
  id: z.string().uuid("id must be a valid UUID").optional(),
  customerId: z.string().uuid("customerId must be a valid UUID"),
  amount: z.number().int().positive("amount must be a positive integer"),
  type: z.enum(["credit", "debit"]),
  paymentMethod: paymentMethodSchema.nullish(),
  note: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  amount: z.number().int().positive().optional(),
  type: z.enum(["credit", "debit"]).optional(),
  paymentMethod: paymentMethodSchema.nullish(),
  note: z.string().optional(),
});

export const auditQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const dateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

export const transactionListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    start: dateString.optional(),
    end: dateString.optional(),
  })
  .refine(
    (query) =>
      !query.start ||
      !query.end ||
      new Date(query.start).getTime() <= new Date(query.end).getTime(),
    {
      message: "start must not be after end",
      path: ["start"],
    },
  );

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

const vpaSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/,
    "UPI ID must look like handle@provider",
  );

export const settingsUpdateSchema = z.object({
  upiId: vpaSchema.nullish(),
  payeeName: z.string().min(1).max(100).nullish(),
  onboardingCompleted: z.boolean().optional(),
  onboardingDismissed: z.boolean().optional(),
});

export const statementQuerySchema = z
  .object({
    start: dateString.optional(),
    end: dateString.optional(),
  })
  .refine(
    (query) =>
      !query.start ||
      !query.end ||
      new Date(query.start).getTime() <= new Date(query.end).getTime(),
    {
      message: "start must not be after end",
      path: ["start"],
    },
  );

export const collectionQuerySchema = z.object({
  sort: z.enum(["amount", "age"]).default("amount"),
});

export const deleteAccountSchema = z.object({
  confirm: z.literal("DELETE", {
    message: 'confirm must be exactly "DELETE"',
  }),
});

type ParseResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: z.ZodError };

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: "Request body must be valid JSON",
        },
      ]),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) return { error: result.error };
  return { data: result.data };
}

export function parseQuery<T>(
  query: Record<string, string>,
  schema: z.ZodType<T>,
): ParseResult<T> {
  const result = schema.safeParse(query);
  if (!result.success) return { error: result.error };
  return { data: result.data };
}
