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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2 } from "lucide-react";

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
  const [type, setType] = useState<"credit" | "debit">(
    "credit"
  );
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
    createTransaction.isPending ||
    updateTransaction.isPending;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Transaction"
              : "New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount
              </Label>

              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>

              <Select
                value={type}
                onValueChange={(value) =>
                  setType(
                    value as "credit" | "debit"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="credit">
                    Credit
                  </SelectItem>

                  <SelectItem value="debit">
                    Debit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              Note (Optional)
            </Label>

            <Input
              id="note"
              placeholder="Enter note..."
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold"
            >
              {loading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}

              {isEditing
                ? "Update Transaction"
                : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}