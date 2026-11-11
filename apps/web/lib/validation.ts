import { z } from "zod";

export type CustomerFormData = z.infer<typeof customerSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[0-9\s-]{10,20}$/, "Invalid phone number"),
});

export const transactionSchema = z.object({
  amount: z
    .number({
      required_error: "Enter an amount",
      invalid_type_error: "Enter an amount",
    })
    .int("Amount must be a whole number of rupees")
    .min(1, "Amount must be at least 1 rupee"),
  transactionType: z.enum(["credit", "debit"]),
  paymentMethod: z
    .enum(["cash", "upi", "other"])
    .nullable()
    .optional(),
  note: z.string().max(200, "Note must be less than 200 characters").optional(),
});