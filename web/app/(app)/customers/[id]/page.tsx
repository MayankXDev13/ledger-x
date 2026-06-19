"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { CustomerHeader } from "@/components/customers/CustomerHeader";

import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionPagination } from "@/components/transactions/TransactionPagination";
import { DeleteTransactionDialog } from "@/components/transactions/DeleteTransactionDialog";

import { useCustomer } from "@/hooks/useCustomers";

import {
  useCustomerTransactions,
  useDeleteTransaction,
} from "@/hooks/useTransactions";

import type { Transaction } from "@/lib/api";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [txDialogOpen, setTxDialogOpen] =
    useState(false);

  const [editingTx, setEditingTx] =
    useState<Transaction | null>(null);

  const [deletingTxId, setDeletingTxId] =
    useState<string | null>(null);

  const { data: customer, isLoading: customerLoading } =
    useCustomer(customerId);

  const {
    data: txns,
    isLoading: txnsLoading,
  } = useCustomerTransactions(customerId, {
    page,
    pageSize,
  });

  const deleteTransaction =
    useDeleteTransaction();

  const balance =
    txns?.data.reduce((acc, tx) => {
      return tx.type === "credit"
        ? acc + tx.amount
        : acc - tx.amount;
    }, 0) ?? 0;

  const totalPages = txns
    ? Math.ceil(txns.total / pageSize)
    : 1;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Link
        href="/customers"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {customerLoading ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : customer ? (
        <CustomerHeader
          customer={customer}
          balance={balance}
        />
      ) : (
        <p className="text-muted-foreground">
          Customer not found
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Transactions
        </h2>

        <Button
          size="sm"
          className="gap-2 bg-linear-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold"
          onClick={() => {
            setEditingTx(null);
            setTxDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-0">
          <TransactionList
            loading={txnsLoading}
            transactions={txns?.data ?? []}
            onAdd={() => {
              setEditingTx(null);
              setTxDialogOpen(true);
            }}
            onEdit={(tx) => {
              setEditingTx(tx);
              setTxDialogOpen(true);
            }}
            onDelete={setDeletingTxId}
          />

          {txns &&
            txns.total > pageSize && (
              <TransactionPagination
                page={page}
                totalPages={totalPages}
                total={txns.total}
                onPrev={() =>
                  setPage((p) => p - 1)
                }
                onNext={() =>
                  setPage((p) => p + 1)
                }
              />
            )}
        </CardContent>
      </Card>

      <TransactionDialog
        open={txDialogOpen}
        customerId={customerId}
        transaction={editingTx}
        onClose={() => {
          setTxDialogOpen(false);
          setEditingTx(null);
        }}
      />

      <DeleteTransactionDialog
        open={!!deletingTxId}
        onClose={() =>
          setDeletingTxId(null)
        }
        onConfirm={() => {
          if (!deletingTxId) return;

          deleteTransaction.mutate(
            deletingTxId
          );

          setDeletingTxId(null);
        }}
      />
    </div>
  );
}