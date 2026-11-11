"use client";

import { useMemo, useState } from "react";
import { useCustomers, useCustomerBalances, useDeleteCustomer } from "@/hooks/useCustomers";
import { useCollection } from "@/hooks/useCollection";
import { QueryErrorState } from "@/components/QueryErrorState";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomersHeader } from "@/components/customers/CustomersHeader";
import { CustomerSearch } from "@/components/customers/CustomerSearch";
import { CustomerGrid } from "@/components/customers/CustomerGrid";
import { EmptyCustomers } from "@/components/customers/EmptyCustomers";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import type { Customer } from "@/lib/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  const { data: customers, isLoading, isError, refetch } = useCustomers();
  const { data: balancesData } = useCustomerBalances();
  const { data: collectionData } = useCollection("amount");
  const deleteCustomer = useDeleteCustomer();

  const balances = useMemo(() => {
    const map = new Map<string, { outstanding: number; ageDays: number | null }>();
    if (balancesData) {
      for (const [customerId, val] of Object.entries(balancesData)) {
        map.set(customerId, val);
      }
    } else if (collectionData?.data) {
      for (const row of collectionData.data) {
        map.set(row.customerId, {
          outstanding: row.outstanding,
          ageDays: row.ageDays,
        });
      }
    }
    return map;
  }, [balancesData, collectionData]);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered =
    customers?.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    ) ?? [];

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto fade-up pb-24 lg:pb-8">
      <CustomersHeader
        total={customers?.length ?? 0}
        onAdd={() => {
          setEditingCustomer(null);
          setDialogOpen(true);
        }}
      />

      {/* Search row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <CustomerSearch value={search} onChange={setSearch} />
        </div>
      </div>

      {/* Results count */}
      {search && !isLoading && (
        <p className="text-xs text-muted-foreground -mt-2">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Grid, error state, or empty state */}
      {isError ? (
        <QueryErrorState
          title="Could not load your customers"
          message="The customer list did not load. Nothing has been changed."
          onRetry={() => refetch()}
        />
      ) : filtered.length > 0 || isLoading ? (
        <CustomerGrid
          customers={filtered}
          balances={balances}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={setDeletingId}
        />
      ) : (
        <EmptyCustomers
          search={search}
          onAdd={() => {
            setEditingCustomer(null);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Mobile FAB — the only primary action below the lg breakpoint. */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 safe-area-bottom">
        <Button
          className="w-full h-12 gap-2 bg-gradient-brand text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20"
          onClick={() => {
            setEditingCustomer(null);
            setDialogOpen(true);
          }}
          id="mobile-add-customer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Customer
        </Button>
      </div>

      <CustomerDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
      />

      <DeleteCustomerDialog
        open={!!deletingId}
        customerName={customers?.find((c) => c.id === deletingId)?.name ?? ""}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (!deletingId) return;
          deleteCustomer.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}