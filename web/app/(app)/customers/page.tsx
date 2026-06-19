"use client";

import { useState } from "react";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomersHeader } from "@/components/customers/CustomersHeader";
import { CustomerSearch } from "@/components/customers/CustomerSearch";
import { CustomerGrid } from "@/components/customers/CustomerGrid";
import { EmptyCustomers } from "@/components/customers/EmptyCustomers";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import type { Customer } from "@/lib/api";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

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
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto">
      <CustomersHeader
        total={customers?.length ?? 0}
        onAdd={() => setDialogOpen(true)}
      />

      <CustomerSearch
        value={search}
        onChange={setSearch}
      />

      {filtered.length > 0 || isLoading ? (
        <CustomerGrid
          customers={filtered}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={setDeletingId}
        />
      ) : (
        <EmptyCustomers
          search={search}
          onAdd={() => setDialogOpen(true)}
        />
      )}

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