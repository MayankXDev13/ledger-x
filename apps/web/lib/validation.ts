import { z } from "zod";

export type CustomerFormData = z.infer<typeof customerSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[0-9\s-]{10,20}$/, "Invalid phone number"),
});

export const transactionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be at least 0.01"),
  transactionType: z.enum(["credit", "debit"]),
  note: z.string().max(200, "Note must be less than 200 characters").optional(),
});