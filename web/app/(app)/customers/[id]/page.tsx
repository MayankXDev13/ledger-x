"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Hash,
  Download,
  Search,
  SlidersHorizontal,
  Calendar,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

import { CustomerProfileHeader } from "@/components/customers/CustomerProfileHeader";
import { CustomerAnalyticsCards } from "@/components/customers/CustomerAnalyticsCards";

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

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: customer, isLoading: customerLoading } =
    useCustomer(customerId);

  const {
    data: txns,
    isLoading: txnsLoading,
  } = useCustomerTransactions(customerId, { page, pageSize });

  const deleteTransaction = useDeleteTransaction();

  const allTransactions = txns?.data ?? [];

  /* ─ Analytics ─ */
  const totalCredit = allTransactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);

  const totalDebit = allTransactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalCredit - totalDebit;
  const totalPages = txns ? Math.ceil(txns.total / pageSize) : 1;

  /* ─ Running balances ─ */
  let runningBalance = 0;
  const txnsWithBalance = [...allTransactions]
    .reverse()
    .map((tx) => {
      runningBalance =
        tx.type === "credit"
          ? runningBalance + tx.amount
          : runningBalance - tx.amount;
      return { ...tx, runningBalance };
    })
    .reverse();

  /* ─ Search filter ─ */
  const filtered = txnsWithBalance.filter((tx) =>
    search
      ? tx.note?.toLowerCase().includes(search.toLowerCase()) ||
        tx.type.includes(search.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-24 lg:pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/customers"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Customers
          </Link>
          <span className="text-muted-foreground/40">/</span>
          {customerLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className="text-xs text-foreground font-medium truncate max-w-[120px]">
              {customer?.name}
            </span>
          )}
        </div>

        {/* Customer Profile Header */}
        {customerLoading ? (
          <CustomerProfileHeaderSkeleton />
        ) : customer ? (
          <CustomerProfileHeader
            customer={customer}
            balance={balance}
            onAddTransaction={() => {
              setEditingTx(null);
              setTxDialogOpen(true);
            }}
          />
        ) : (
          <div className="text-muted-foreground text-sm">
            Customer not found.
          </div>
        )}

        {/* Analytics Cards */}
        <CustomerAnalyticsCards
          totalCredit={totalCredit}
          totalDebit={totalDebit}
          netBalance={balance}
          txCount={txns?.total ?? 0}
          loading={txnsLoading}
        />

        {/* Transaction Section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Section toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                Transactions
              </h2>
              {txns && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {txns.total}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="transaction-search"
                  placeholder="Search transactions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-40 sm:w-52 bg-muted/30 border-border/50 focus:border-cyan-500/50 focus:bg-background transition-all"
                />
              </div>

              {/* Filter button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-border/50 hover:border-cyan-500/40"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter</span>
              </Button>

              {/* Date range */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-border/50 hover:border-cyan-500/40 hidden sm:flex"
              >
                <Calendar className="w-3.5 h-3.5" />
                Date
              </Button>

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-border/50 hover:border-cyan-500/40 hidden sm:flex"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>

              {/* Add transaction */}
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-gradient-brand text-slate-900 font-semibold hover:opacity-90 shadow-sm shadow-cyan-500/20"
                onClick={() => {
                  setEditingTx(null);
                  setTxDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>

          {/* Transaction list */}
          <TransactionList
            loading={txnsLoading}
            transactions={filtered}
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

          {txns && txns.total > pageSize && (
            <TransactionPagination
              page={page}
              totalPages={totalPages}
              total={txns.total}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </div>
      </div>

      {/* Mobile sticky Add Transaction */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40">
        <Button
          className="w-full h-12 gap-2 bg-gradient-brand text-slate-900 font-bold text-sm shadow-lg shadow-cyan-500/20"
          onClick={() => {
            setEditingTx(null);
            setTxDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      {/* Dialogs */}
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
        onClose={() => setDeletingTxId(null)}
        onConfirm={() => {
          if (!deletingTxId) return;
          deleteTransaction.mutate(deletingTxId);
          setDeletingTxId(null);
        }}
      />
    </div>
  );
}

function CustomerProfileHeaderSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-2xl bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-32 bg-muted rounded-md" />
            <div className="h-4 w-24 bg-muted rounded-md" />
            <div className="h-3 w-20 bg-muted rounded-md" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="h-4 w-24 bg-muted rounded-md" />
          <div className="h-10 w-36 bg-muted rounded-lg" />
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-muted rounded-lg" />
            <div className="h-8 w-20 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}