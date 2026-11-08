"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { toast } from "sonner";

export const transactionKeys = {
  all: ["transactions"] as const,
  byCustomer: (customerId: string, params?: object) =>
    params
      ? ([...transactionKeys.all, "customer", customerId, params] as const)
      : ([...transactionKeys.all, "customer", customerId] as const),
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};

export function useCustomerTransactions(
  customerId: string,
  params?: { page?: number; pageSize?: number; start?: string; end?: string }
) {
  return useQuery({
    queryKey: transactionKeys.byCustomer(customerId, params),
    queryFn: () => transactionsApi.listByCustomer(customerId, params),
    enabled: !!customerId,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: transactionKeys.byCustomer(data.customerId) });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["statements"] });
      toast.success("Transaction created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        customerId?: string;
        amount?: number;
        type?: "credit" | "debit";
        paymentMethod?: import("@/lib/api").PaymentMethod | null;
        note?: string;
      };
    }) => transactionsApi.update(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: transactionKeys.byCustomer(data.customerId) });
      qc.invalidateQueries({ queryKey: transactionKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["statements"] });
      toast.success("Transaction updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["statements"] });
      toast.success("Transaction deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
