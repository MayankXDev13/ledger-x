"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCustomer } from "@/hooks/useCustomers";
import {
  useCustomerTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/api";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface TxDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  transaction?: Transaction | null;
}

function TransactionDialog({ open, onClose, customerId, transaction }: TxDialogProps) {
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "");
  const [type, setType] = useState<"credit" | "debit">(transaction?.type ?? "credit");
  const [note, setNote] = useState(transaction?.note ?? "");

  const isEditing = !!transaction;
  const loading = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { amount: Number(amount), type, note: note || undefined };
    if (isEditing) {
      await update.mutateAsync({ id: transaction!.id, data });
    } else {
      await create.mutateAsync({ customerId, ...data });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "New Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-muted/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "credit" | "debit")}>
                <SelectTrigger className="bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">
                    <span className="text-emerald-400">↑ Credit</span>
                  </SelectItem>
                  <SelectItem value="debit">
                    <span className="text-red-400">↓ Debit</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-muted/20"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: txns, isLoading: txnsLoading } = useCustomerTransactions(customerId, { page, pageSize });

  const deleteTransaction = useDeleteTransaction();
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Compute balance from transactions
  const balance = txns?.data.reduce((acc, tx) => {
    return tx.type === "credit" ? acc + tx.amount : acc - tx.amount;
  }, 0) ?? 0;

  const totalPages = txns ? Math.ceil(txns.total / pageSize) : 1;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Back */}
      <Link href="/customers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Customer Header */}
      {customerLoading ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : customer ? (
        <Card className="border-border/50 bg-card/80 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5" />
          <CardContent className="relative pt-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-900 text-xl font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs text-muted-foreground">Page Balance</div>
                <div className={cn(
                  "text-2xl font-bold tabular-nums",
                  balance >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Customer not found.</p>
      )}

      {/* Transactions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
        <Button
          onClick={() => setTxDialogOpen(true)}
          size="sm"
          className="gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-0">
          {txnsLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : txns && txns.data.length > 0 ? (
            <div>
              {txns.data.map((tx, i) => (
                <div
                  key={tx.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors group",
                    i !== 0 && "border-t border-border/30"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      tx.type === "credit"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    )}>
                      {tx.type === "credit" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-xs px-2 py-0",
                            tx.type === "credit"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/15 text-red-400 border-red-500/20"
                          )}
                          variant="outline"
                        >
                          {tx.type}
                        </Badge>
                        {tx.note && (
                          <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <StickyNote className="w-3 h-3" />
                            {tx.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(tx.createdAt), "MMM d, yyyy · h:mm a")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-base font-bold tabular-nums",
                      tx.type === "credit" ? "text-emerald-400" : "text-red-400"
                    )}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => {
                          setEditingTx(tx);
                          setTxDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingTxId(tx.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {txns.total > pageSize && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} · {txns.total} total
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <TrendingUp className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add the first transaction for this customer
              </p>
              <Button
                onClick={() => setTxDialogOpen(true)}
                className="mt-4 gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={txDialogOpen}
        onClose={() => {
          setTxDialogOpen(false);
          setEditingTx(null);
        }}
        customerId={customerId}
        transaction={editingTx}
      />

      {/* Delete Alert */}
      <AlertDialog open={!!deletingTxId} onOpenChange={() => setDeletingTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The transaction will be soft-deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingTxId) {
                  deleteTransaction.mutate(deletingTxId);
                  setDeletingTxId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
