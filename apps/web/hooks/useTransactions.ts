"use client";

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { formatApiError } from "@/lib/api-error";
import { dashboardKeys } from "./useDashboard";
import { collectionKeys } from "./useCollection";
import { statementKeys } from "./useStatement";
import { customerKeys } from "./useCustomers";
import { toast } from "sonner";

export const transactionKeys = {
  all: ["transactions"] as const,
  byCustomer: (customerId: string, params?: object) =>
    params
      ? ([...transactionKeys.all, "customer", customerId, params] as const)
      : ([...transactionKeys.all, "customer", customerId] as const),
  byCustomerInfinite: (customerId: string, params?: object) =>
    params
      ? ([...transactionKeys.all, "customer-infinite", customerId, params] as const)
      : ([...transactionKeys.all, "customer-infinite", customerId] as const),
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

export function useInfiniteCustomerTransactions(
  customerId: string,
  params?: { pageSize?: number; start?: string; end?: string }
) {
  const pageSize = params?.pageSize ?? 10;
  return useInfiniteQuery({
    queryKey: transactionKeys.byCustomerInfinite(customerId, params),
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.listByCustomer(customerId, {
        page: pageParam,
        pageSize,
        start: params?.start,
        end: params?.end,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * pageSize;
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
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
    onSuccess: async () => {
      // A transaction changes the balance the customer domain shows, so that
      // domain is invalidated too. Awaiting the invalidation means the
      // mutation settles only once the affected views hold fresh data.
      await Promise.all([
        qc.invalidateQueries({ queryKey: transactionKeys.all }),
        qc.invalidateQueries({ queryKey: customerKeys.all }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
        qc.invalidateQueries({ queryKey: statementKeys.all }),
      ]);
      toast.success("Transaction created");
    },
    onError: (err: Error) => toast.error(formatApiError(err)),
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
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: transactionKeys.all }),
        qc.invalidateQueries({ queryKey: customerKeys.all }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
        qc.invalidateQueries({ queryKey: statementKeys.all }),
      ]);
      toast.success("Transaction updated");
    },
    onError: (err: Error) => toast.error(formatApiError(err)),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: transactionKeys.all }),
        qc.invalidateQueries({ queryKey: customerKeys.all }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
        qc.invalidateQueries({ queryKey: statementKeys.all }),
      ]);
      toast.success("Transaction deleted");
    },
    onError: (err: Error) => toast.error(formatApiError(err)),
  });
}
