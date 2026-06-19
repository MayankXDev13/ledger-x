"use client";

import { useEffect, useState } from "react";

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
import { Loader2, ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";

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

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [note, setNote] = useState("");

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setNote(transaction.note ?? "");
    } else {
      setAmount("");
      setType("credit");
      setNote("");
    }
  }, [transaction, open]);

  const loading =
    createTransaction.isPending || updateTransaction.isPending;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      amount: Number(amount),
      type,
      note: note.trim() || undefined,
    };

    try {
      if (isEditing) {
        await updateTransaction.mutateAsync({
          id: transaction.id,
          data: payload,
        });
      } else {
        await createTransaction.mutateAsync({
          customerId,
          ...payload,
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
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
            type === "credit"
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

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Type selector — pill style */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("credit")}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all",
                  type === "credit"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10"
                    : "border-border/60 text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5"
                )}
              >
                <ArrowUpRight className="w-4 h-4" />
                Credit
              </button>
              <button
                type="button"
                onClick={() => setType("debit")}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all",
                  type === "debit"
                    ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-sm shadow-red-500/10"
                    : "border-border/60 text-muted-foreground hover:border-red-500/30 hover:bg-red-500/5"
                )}
              >
                <ArrowDownRight className="w-4 h-4" />
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
                <IndianRupee className="w-3 h-3 text-muted-foreground" />
              </div>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={cn(
                  "pl-10 h-11 text-base font-semibold bg-muted/20 border-border/50 focus:border-cyan-500/50 focus:bg-background transition-all",
                  type === "credit" && amount
                    ? "text-emerald-400"
                    : type === "debit" && amount
                      ? "text-red-400"
                      : ""
                )}
              />
            </div>
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
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 bg-muted/20 border-border/50 focus:border-cyan-500/50 focus:bg-background transition-all text-sm"
            />
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
              disabled={loading || !amount}
              className={cn(
                "flex-1 h-10 font-bold transition-all",
                type === "credit"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 shadow-sm shadow-emerald-500/20"
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 shadow-sm shadow-red-500/20"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : type === "credit" ? "Record Credit" : "Record Debit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}