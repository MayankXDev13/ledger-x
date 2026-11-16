"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Loader2,
  Phone,
  Calendar,
  MoreHorizontal,
  Pencil,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { CustomerAnalyticsCards } from "@/components/customers/CustomerAnalyticsCards";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";

import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import { TransactionList } from "@/components/transactions/TransactionList";
import { DeleteTransactionDialog } from "@/components/transactions/DeleteTransactionDialog";

import {
  useCustomer,
  useDeleteCustomer,
  useCustomerBalances,
} from "@/hooks/useCustomers";
import {
  useInfiniteCustomerTransactions,
  useDeleteTransaction,
} from "@/hooks/useTransactions";
import { useExportTransactions } from "@/hooks/useDataPortability";

import type { Customer, Transaction } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { avatarGradient } from "@/lib/avatar";
import { balanceTone } from "@/lib/money";
import { oldestUnpaidLabel } from "@/lib/labels";

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

  // Age of this customer's oldest unpaid credit, used for balance tone + label.
  const { data: balanceMap } = useCustomerBalances();
  const ageDays = balanceMap?.[customerId]?.ageDays ?? null;

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

  const openAddTransaction = () => {
    setEditingTx(null);
    setTxDialogOpen(true);
  };

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
          <InlineProfileHeader
            customer={customer}
            balance={balance}
            ageDays={ageDays}
            onAddTransaction={openAddTransaction}
            onDelete={() => setDeletingCustomer(true)}
          />
        ) : (
          <div className="text-muted-foreground text-sm">
            Customer not found.
          </div>
        )}

        {/* Analytics Cards — stacked hairline rows below sm, card grid at sm+ */}
        <div className="sm:hidden rounded-xl border border-border bg-card overflow-hidden">
          {[
            {
              label: "Total Credit",
              value: formatCurrency(totalCredit),
              valueClass: "text-foreground",
            },
            {
              label: "Total Paid",
              value: formatCurrency(totalDebit),
              valueClass: "text-positive",
            },
            {
              label: "Net Balance",
              value: formatCurrency(balance),
              valueClass: "text-foreground",
            },
            {
              label: "Transactions",
              value: String(totalCount),
              valueClass: "text-foreground",
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3",
                index > 0 && "border-t border-border/60"
              )}
            >
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {stat.label}
              </span>
              {txnsLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    stat.valueClass
                  )}
                >
                  {stat.value}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="hidden sm:block">
          <CustomerAnalyticsCards
            totalCredit={totalCredit}
            totalDebit={totalDebit}
            netBalance={balance}
            txCount={totalCount}
            loading={txnsLoading}
          />
        </div>

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

              {/* Add transaction — demoted to a named, non-primary icon control.
                  The sticky bar is the single primary on small screens; the
                  profile header owns the desktop primary. */}
              <Button
                variant="outline"
                size="icon"
                aria-label="Add transaction"
                className="size-11 shrink-0 border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                onClick={openAddTransaction}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Transaction list */}
          <TransactionList
            loading={txnsLoading}
            transactions={filtered}
            onAdd={openAddTransaction}
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

      {/* Mobile sticky Add Transaction — the single primary below lg */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 safe-area-bottom">
        <Button
          className="w-full h-12 gap-2 bg-gradient-brand text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20"
          onClick={openAddTransaction}
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

/**
 * The customer hero. Inlined here (rather than editing its own file) so the
 * balance tone can be driven by the shared `balanceTone` helper and the full
 * aging phrase by `oldestUnpaidLabel`, while staying within the two-file scope.
 */
function InlineProfileHeader({
  customer,
  balance,
  ageDays,
  onAddTransaction,
  onDelete,
}: {
  customer: Customer;
  balance: number;
  ageDays: number | null;
  onAddTransaction: () => void;
  onDelete: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const exportTransactions = useExportTransactions(customer.id);
  const avatarFill = avatarGradient(customer.name);

  const isReceivable = balance > 0;
  const isPayable = balance < 0;

  // Neutral until the oldest unpaid credit is overdue; danger only at 60+ days.
  const tone = balanceTone(ageDays);
  const heroToneClass = tone === "danger" ? "text-destructive" : "text-foreground";

  return (
    <>
      <div className="relative rounded-xl border border-border bg-card overflow-hidden">
        {/* Subtle ambient gradient */}
        <div
          className={cn(
            "absolute inset-0 opacity-[0.03] pointer-events-none",
            isReceivable
              ? "bg-linear-to-br from-brand to-brand-light"
              : isPayable
                ? "bg-linear-to-br from-destructive to-destructive/40"
                : "bg-linear-to-br from-zinc-400 to-zinc-500"
          )}
        />
        {/* Top accent line */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-px",
            isReceivable
              ? "bg-linear-to-r from-transparent via-primary/40 to-transparent"
              : isPayable
                ? "bg-linear-to-r from-transparent via-destructive/40 to-transparent"
                : "bg-linear-to-r from-transparent via-zinc-500/30 to-transparent"
          )}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
            {/* Left — Avatar + Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className={cn(
                  "size-14 sm:size-16 rounded-2xl bg-linear-to-br flex items-center justify-center shrink-0 shadow-lg text-white text-2xl font-bold select-none",
                  avatarFill
                )}
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {customer.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-semibold",
                      isReceivable
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : isPayable
                          ? "border-border bg-muted text-muted-foreground"
                          : "border-positive/25 bg-positive/10 text-positive"
                    )}
                  >
                    {isReceivable ? (
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    ) : isPayable ? (
                      <ArrowDownRight className="w-2.5 h-2.5" />
                    ) : (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    )}
                    {isReceivable
                      ? "Receivable"
                      : isPayable
                        ? "Payable"
                        : "Settled"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {customer.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {customer.createdAt
                      ? `Customer since ${new Date(customer.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                      : "Customer since —"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right — Balance + Actions */}
            <div className="flex flex-col items-start sm:items-end gap-3 sm:shrink-0">
              <div className="flex flex-col sm:items-end gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Current Balance
                </span>
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-bold tabular-nums tracking-tight",
                    heroToneClass
                  )}
                >
                  {formatCurrency(balance)}
                </div>
                {/* Direction is always stated in text, never by colour alone. */}
                <span
                  className={cn("text-xs font-medium", heroToneClass)}
                >
                  {isReceivable
                    ? "▲ Receivable from customer"
                    : isPayable
                      ? "▼ Payable to customer"
                      : "✓ All settled"}
                </span>
                {isReceivable && ageDays !== null && (
                  <span
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      tone === "danger" ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {oldestUnpaidLabel(ageDays)}
                  </span>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                {/* Desktop-only primary: the sticky bar is hidden at lg+ */}
                <Button
                  size="sm"
                  className="hidden lg:inline-flex h-8 gap-1.5 text-xs bg-gradient-brand text-primary-foreground font-bold shadow-sm shadow-primary/20 hover:opacity-90"
                  onClick={onAddTransaction}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Transaction
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs border-border/60 hover:border-primary/40"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-11 sm:size-9 border-border/60 hover:border-primary/40"
                      aria-label={`More actions for ${customer.name}`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      className="text-xs cursor-pointer"
                      onClick={() => exportTransactions.mutate()}
                    >
                      Export transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-xs cursor-pointer">
                      <Link href={`/customers/statement?id=${customer.id}`}>
                        View statement
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs text-destructive focus:text-destructive cursor-pointer"
                      onClick={onDelete}
                    >
                      Delete customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomerDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
      />
    </>
  );
}

function CustomerProfileHeaderSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="size-16 rounded-2xl bg-muted" />
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
