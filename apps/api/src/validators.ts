import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
});

export const createTransactionSchema = z.object({
  customerId: z.string().uuid("customerId must be a valid UUID"),
  amount: z.number().int().positive("amount must be a positive integer"),
  type: z.enum(["credit", "debit"]),
  note: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  amount: z.number().int().positive().optional(),
  type: z.enum(["credit", "debit"]).optional(),
  note: z.string().optional(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
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
