"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { FaArrowUp, FaArrowDown, FaRupeeSign, FaSpinner } from "react-icons/fa";
import { cn } from "@/lib/utils";

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

  const isEditing = !!transaction;

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          amount: transaction.amount,
          transactionType: transaction.type,
          note: transaction.note || "",
        }
      : {
          amount: 0,
          transactionType: "credit",
          note: "",
        },
  });

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      if (isEditing) {
        await updateTransaction.mutateAsync({
          id: transaction!.id,
          data,
        });
      } else {
        await createTransaction.mutateAsync({
          customerId,
          amount: data.amount,
          type: data.transactionType,
          note: data.note,
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (transaction) {
      form.reset({
        amount: transaction.amount,
        transactionType: transaction.type,
        note: transaction.note || "",
      });
    } else {
      form.reset({
        amount: 0,
        transactionType: "credit",
        note: "",
      });
    }
  }, [transaction, open, form]);

  const loading =
    createTransaction.isPending || updateTransaction.isPending;

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
              form.watch("transactionType") === "credit"
                ? "bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
                : "bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
            )}
          />

          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Transaction" : "New Transaction"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? "Update the transaction details below"
                : "Record a payment or receipt for this customer"}
            </p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-1">
          {/* Type selector — pill style */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => form.setValue("transactionType", "credit")}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all",
                  form.watch("transactionType") === "credit"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10"
                    : "border-border/60 text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5"
                )}
              >
                <FaArrowUp className="w-4 h-4" />
                Credit
              </button>
              <button
                type="button"
                onClick={() => form.setValue("transactionType", "debit")}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all",
                  form.watch("transactionType") === "debit"
                    ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-sm shadow-red-500/10"
                    : "border-border/60 text-muted-foreground hover:border-red-500/30 hover:bg-red-500/5"
                )}
              >
                <FaArrowDown className="w-4 h-4" />
                Debit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                <FaRupeeSign className="w-3 h-3 text-muted-foreground" />
              </div>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
                className={cn(
                  "pl-10 h-11 text-base font-semibold bg-muted/20 border-border/50 focus:border-primary/50 focus:bg-background transition-all",
                  form.watch("transactionType") === "credit" && form.getValues("amount") > 0
                    ? "text-emerald-400"
                    : form.watch("transactionType") === "debit" && form.getValues("amount") > 0
                      ? "text-red-400"
                      : "",
                  form.formState.errors.amount && "border-destructive"
                )}
              />
            </div>
            <FormError name="amount" />
          </div>

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
              disabled={loading || !form.formState.isValid}
              className={cn(
                "flex-1 h-10 font-bold transition-all",
                form.watch("transactionType") === "credit"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 shadow-sm shadow-emerald-500/20"
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 shadow-sm shadow-red-500/20"
              )}
            >
              {loading && <FaSpinner className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : form.watch("transactionType") === "credit" ? "Record Credit" : "Record Debit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </FormProvider>
  );
}