"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CustomerProfileHeader } from "@/components/customers/CustomerProfileHeader";
import { CustomerAnalyticsCards } from "@/components/customers/CustomerAnalyticsCards";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";

import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import { TransactionList } from "@/components/transactions/TransactionList";
import { DeleteTransactionDialog } from "@/components/transactions/DeleteTransactionDialog";

import { useCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import {
  useInfiniteCustomerTransactions,
  useDeleteTransaction,
} from "@/hooks/useTransactions";

import type { Transaction } from "@/lib/api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function CustomerDetailView() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id") ?? "";

  const pageSize = 10;
  const observerRef = useRef<HTMLDivElement | null>(null);

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">(
    "all",
  );

  const { data: customer, isLoading: customerLoading } =
    useCustomer(customerId);

  const {
    data: txnsData,
    isLoading: txnsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCustomerTransactions(customerId, { pageSize });

  const deleteTransaction = useDeleteTransaction();
  const deleteCustomer = useDeleteCustomer();
  const router = useRouter();

  const allTransactions = txnsData?.pages.flatMap((p) => p.data) ?? [];
  const firstPage = txnsData?.pages[0];

  /* ─ Analytics: whole-customer aggregates from the server, independent of
     the visible batch. Guards keep older API responses rendering instead of
     NaN during the rollout window. ─ */
  const totalCredit = Number(firstPage?.totalCredit ?? 0);
  const totalDebit = Number(firstPage?.totalDebit ?? 0);

  const balance = totalCredit - totalDebit;
  const totalCount = firstPage?.total ?? 0;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ─ Search + type filter (client-side over the loaded transactions) ─ */
  const filtered = allTransactions.filter((tx) => {
    const matchesSearch = search
      ? tx.note?.toLowerCase().includes(search.toLowerCase()) ||
        tx.type.includes(search.toLowerCase())
      : true;
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-24 lg:pb-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/customers" className="text-xs">
                  Customers
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {customerLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <BreadcrumbPage className="text-xs font-medium truncate max-w-30">
                  {customer?.name}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
            onDelete={() => setDeletingCustomer(true)}
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
          txCount={totalCount}
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
              {txnsData && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {allTransactions.length} of {totalCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="transaction-search"
                  aria-label="Search this customer's transactions"
                  placeholder="Search transactions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-40 sm:w-52 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-background transition-all"
                />
              </div>

              {/* Type filter */}
              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  setTypeFilter(v as "all" | "credit" | "debit")
                }
              >
                <SelectTrigger
                  aria-label="Filter transactions by type"
                  className="h-8 w-24 sm:w-28 text-xs border-border/50 bg-muted/30"
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>

              {/* Add transaction */}
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 shadow-sm shadow-primary/20"
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

          {/* Infinite scroll sentinel & status */}
          {hasNextPage && (
            <div
              ref={observerRef}
              className="py-4 flex justify-center border-t border-border/50 bg-card"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs text-muted-foreground gap-2"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                {isFetchingNextPage ? "Loading more…" : "Load more transactions"}
              </Button>
            </div>
          )}
          {!hasNextPage && allTransactions.length > 0 && (
            <div className="py-3 text-center text-xs text-muted-foreground border-t border-border/40">
              Showing all {allTransactions.length} transaction{allTransactions.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky Add Transaction */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 safe-area-bottom">
        <Button
          className="w-full h-12 gap-2 bg-gradient-brand text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20"
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

      <DeleteCustomerDialog
        open={deletingCustomer}
        customerName={customer?.name ?? ""}
        onClose={() => setDeletingCustomer(false)}
        onConfirm={() => {
          deleteCustomer.mutate(customerId, {
            onSuccess: () => {
              // Leave the page for the customer that no longer exists.
              router.push("/customers");
            },
          });
          setDeletingCustomer(false);
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
