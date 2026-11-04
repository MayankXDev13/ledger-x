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

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
});

export const addTagToTransactionSchema = z.object({
  tag_id: z.string().uuid("tag_id must be a valid UUID"),
});

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: z.ZodError }> {
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
