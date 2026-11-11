"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  CircleEllipsis,
  Loader2,
  Smartphone,
  X,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatApiError } from "@/lib/api-error";

import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";

import { transactionSchema, type TransactionFormData } from "@/lib/validation";

import type { Transaction } from "@/lib/api";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  transaction?: Transaction | null;
}

export function TransactionDialog({
  open,
  onClose,
  customerId,
  transaction,
}: TransactionDialogProps) {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!transaction;

  const paymentOptions = [
    { value: "cash", label: "Cash", icon: Banknote },
    { value: "upi", label: "UPI", icon: Smartphone },
    { value: "other", label: "Other", icon: CircleEllipsis },
    { value: null, label: "None", icon: X },
  ] as const;

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: transaction
      ? {
          amount: transaction.amount,
          transactionType: transaction.type,
          paymentMethod: transaction.paymentMethod ?? null,
          note: transaction.note || "",
        }
      : {
          amount: 0,
          transactionType: "credit",
          paymentMethod: null,
          note: "",
        },
  });

  const handleSubmit = async (data: TransactionFormData) => {
    setSubmitError(null);
    try {
      const paymentMethod = data.paymentMethod ?? null;

      if (isEditing) {
        // The API's update contract names the field `type`; the form calls it
        // `transactionType`, so the payload is mapped field by field.
        await updateTransaction.mutateAsync({
          id: transaction!.id,
          data: {
            amount: data.amount,
            type: data.transactionType,
            paymentMethod,
            note: data.note,
          },
        });
      } else {
        await createTransaction.mutateAsync({
          customerId,
          amount: data.amount,
          type: data.transactionType,
          paymentMethod,
          note: data.note,
        });
      }

      onClose();
    } catch (error) {
      setSubmitError(formatApiError(error));
    }
  };

  useEffect(() => {
    if (transaction) {
      form.reset({
        amount: transaction.amount,
        transactionType: transaction.type,
        paymentMethod: transaction.paymentMethod ?? null,
        note: transaction.note || "",
      });
    } else {
      form.reset({
        amount: 0,
        transactionType: "credit",
        paymentMethod: null,
        note: "",
      });
    }
  }, [transaction, open, form]);

  const loading =
    createTransaction.isPending || updateTransaction.isPending;

  const isCredit = form.watch("transactionType") === "credit";
  const amountError = form.formState.errors.amount?.message;

  return (
    <FormProvider {...form}>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) onClose();
        }}
      >
        <DialogContent className="sm:max-w-sm border-border/60 bg-card">
          {/* Accent top bar based on type */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-px rounded-t-lg",
              isCredit
                ? "bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                : "bg-gradient-to-r from-transparent via-positive/50 to-transparent"
            )}
          />

          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Transaction" : "New Transaction"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditing
                ? "Update the transaction details below"
                : "Record a payment or receipt for this customer"}
            </DialogDescription>
          </DialogHeader>

          {/* The schema owns the messaging, so the browser must not block the
              submit with its own step/min tooltips. */}
          <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-1">
          {/* Type selector — radiogroup */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transaction type">
              <button
                type="button"
                role="radio"
                aria-checked={isCredit}
                onClick={() => form.setValue("transactionType", "credit")}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCredit
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <ArrowUp className="w-4 h-4" />
                You Gave (Udhar)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!isCredit}
                onClick={() => form.setValue("transactionType", "debit")}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !isCredit
                    ? "bg-positive/10 border-positive/40 text-positive"
                    : "border-border/60 text-muted-foreground hover:border-positive/30 hover:bg-positive/5"
                )}
              >
                <ArrowDown className="w-4 h-4" />
                You Got (Payment)
              </button>
            </div>
          </fieldset>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                <IndianRupee className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </div>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="0"
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? "amount-error" : undefined}
                {...form.register("amount", {
                  // react-hook-form also runs this on reset, where the value
                  // is the number from the form defaults — so it has to
                  // accept anything, not just a string.
                  setValueAs: (value: unknown) => {
                    if (typeof value === "string" && value.trim() === "") {
                      return undefined;
                    }
                    return Number(value);
                  },
                })}
                className={cn(
                  "pl-10 h-11 text-base font-semibold bg-muted/20 border-border/50 focus:border-primary/50 focus:bg-background transition-all tabular-nums",
                  !isCredit && form.getValues("amount") > 0
                    ? "text-positive"
                    : "",
                  amountError && "border-destructive"
                )}
              />
            </div>
            <FormError name="amount" />
          </div>

          {/* Payment method */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment method{" "}
              <span className="normal-case font-normal text-muted-foreground/60">
                (optional)
              </span>
            </legend>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentOptions.map(({ value, label, icon: Icon }) => {
                const selected =
                  (form.watch("paymentMethod") ?? null) === value;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      form.setValue("paymentMethod", value, {
                        shouldDirty: true,
                      })
                    }
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 h-14 rounded-lg border text-xs font-semibold transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/25 hover:bg-primary/5",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            <FormError name="paymentMethod" />
          </fieldset>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="tx-note" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Note{" "}
              <span className="normal-case font-normal text-muted-foreground/60">
                (optional)
              </span>
            </Label>
            <Input
              id="tx-note"
              placeholder="e.g. Monthly rent, Product sale…"
              {...form.register("note")}
              className="h-10 bg-muted/20 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm"
            />
            <FormError name="note" />
          </div>

          {submitError ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {submitError}
            </p>
          ) : null}

          {/* Footer */}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border/60 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 h-10 font-bold transition-all",
                isCredit
                  ? "bg-gradient-to-r from-brand-fill to-brand-deep text-primary-foreground hover:opacity-90"
                  : "bg-gradient-to-r from-positive to-positive/80 text-white hover:opacity-90"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
              {isEditing
                ? "Update"
                : isCredit
                  ? "Record Credit"
                  : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </FormProvider>
  );
}
