"use client";

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  transactionsApi,
  type Analytics,
  type PagedTransactions,
  type Transaction,
} from "@/lib/api";
import { formatApiError } from "@/lib/api-error";
import {
  applyBalanceDelta,
  applyCreatedTransactionToInfinite,
  applyCreatedTransactionToPaged,
  applyDeletedTransactionToInfinite,
  applyTransactionToDashboardAnalytics,
  applyTransactionToDashboardMetrics,
  applyUpdatedTransactionToInfinite,
  type CustomerBalancesMap,
  type DashboardMetrics,
} from "@/lib/transaction-cache";
import { dashboardKeys } from "./useDashboard";
import { collectionKeys } from "./useCollection";
import { statementKeys } from "./useStatement";
import { customerKeys } from "./useCustomers";
import { toast } from "sonner";

/**
 * Match the dashboard's polling cadence so a customer's ledger refreshes
 * automatically when entries arrive from another tab or device.
 */
const TRANSACTIONS_POLL_INTERVAL = 10_000;

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
    refetchInterval: TRANSACTIONS_POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

export function useInfiniteCustomerTransactions(
  customerId: string,
  params?: { pageSize?: number; start?: string; end?: string }
) {
  const pageSize = params?.pageSize ?? 10;
  const normalizedParams = {
    pageSize,
    start: params?.start,
    end: params?.end,
  };
  return useInfiniteQuery({
    queryKey: transactionKeys.byCustomerInfinite(customerId, normalizedParams),
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.listByCustomer(customerId, {
        page: pageParam,
        pageSize: normalizedParams.pageSize,
        start: normalizedParams.start,
        end: normalizedParams.end,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * normalizedParams.pageSize;
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: !!customerId,
    refetchInterval: TRANSACTIONS_POLL_INTERVAL,
    refetchOnWindowFocus: true,
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
    onSuccess: async (created) => {
      // Patch the customer's transaction lists, balances, and dashboard caches
      // immediately from the server response so every view updates without
      // waiting for background refetches, then reconcile with the server.
      const prevBalances = qc.getQueryData<CustomerBalancesMap>(
        customerKeys.balances(),
      );
      const prevOutstanding = prevBalances?.[created.customerId]?.outstanding;

      qc.setQueriesData<InfiniteData<PagedTransactions>>(
        { queryKey: transactionKeys.byCustomerInfinite(created.customerId) },
        (old) => applyCreatedTransactionToInfinite(old, created),
      );
      qc.setQueriesData<PagedTransactions>(
        { queryKey: transactionKeys.byCustomer(created.customerId) },
        (old) => applyCreatedTransactionToPaged(old, created),
      );

      const creditDelta = created.type === "credit" ? created.amount : 0;
      const debitDelta = created.type === "debit" ? created.amount : 0;
      const delta = creditDelta - debitDelta;

      qc.setQueryData<CustomerBalancesMap>(customerKeys.balances(), (old) =>
        applyBalanceDelta(old, created.customerId, delta),
      );
      qc.setQueryData<DashboardMetrics>(dashboardKeys.metrics(), (old) =>
        applyTransactionToDashboardMetrics(old, delta, created.createdAt),
      );
      qc.setQueryData<Analytics>(dashboardKeys.analytics(), (old) =>
        applyTransactionToDashboardAnalytics(old, {
          customerId: created.customerId,
          creditDelta,
          debitDelta,
          createdAt: created.createdAt,
          previousCustomerOutstanding: prevOutstanding,
        }),
      );

      qc.setQueryData<Transaction[]>(
        dashboardKeys.recentTransactions(),
        (old) => {
          if (!old) return old;
          if (old.some((tx) => tx.id === created.id)) return old;
          return [created, ...old].slice(0, 5);
        },
      );

      await Promise.all([
        qc.invalidateQueries({
          queryKey: transactionKeys.byCustomerInfinite(created.customerId),
        }),
        qc.invalidateQueries({
          queryKey: transactionKeys.byCustomer(created.customerId),
        }),
        qc.invalidateQueries({ queryKey: customerKeys.balances() }),
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
    onSuccess: async (updated) => {
      const prevBalances = qc.getQueryData<CustomerBalancesMap>(
        customerKeys.balances(),
      );
      const prevOutstanding = prevBalances?.[updated.customerId]?.outstanding;

      let balanceDelta = 0;
      let creditDelta = 0;
      let debitDelta = 0;
      qc.setQueriesData<InfiniteData<PagedTransactions>>(
        { queryKey: transactionKeys.byCustomerInfinite(updated.customerId) },
        (old) => {
          const previous = old?.pages
            .flatMap((p) => p.data)
            .find((tx) => tx.id === updated.id);
          const res = applyUpdatedTransactionToInfinite(old, updated);
          if (res.balanceDelta !== 0) {
            balanceDelta = res.balanceDelta;
            if (previous) {
              creditDelta =
                (updated.type === "credit" ? updated.amount : 0) -
                (previous.type === "credit" ? previous.amount : 0);
              debitDelta =
                (updated.type === "debit" ? updated.amount : 0) -
                (previous.type === "debit" ? previous.amount : 0);
            }
          }
          return res.next;
        },
      );

      if (balanceDelta !== 0) {
        qc.setQueryData<CustomerBalancesMap>(customerKeys.balances(), (old) =>
          applyBalanceDelta(old, updated.customerId, balanceDelta),
        );
        qc.setQueryData<DashboardMetrics>(dashboardKeys.metrics(), (old) =>
          applyTransactionToDashboardMetrics(
            old,
            balanceDelta,
            updated.createdAt,
          ),
        );
        qc.setQueryData<Analytics>(dashboardKeys.analytics(), (old) =>
          applyTransactionToDashboardAnalytics(old, {
            customerId: updated.customerId,
            creditDelta,
            debitDelta,
            createdAt: updated.createdAt,
            previousCustomerOutstanding: prevOutstanding,
          }),
        );
      }

      qc.setQueryData<Transaction[]>(
        dashboardKeys.recentTransactions(),
        (old) =>
          old?.map((tx) => (tx.id === updated.id ? { ...tx, ...updated } : tx)),
      );

      await Promise.all([
        qc.invalidateQueries({
          queryKey: transactionKeys.byCustomerInfinite(updated.customerId),
        }),
        qc.invalidateQueries({
          queryKey: transactionKeys.byCustomer(updated.customerId),
        }),
        qc.invalidateQueries({ queryKey: transactionKeys.detail(updated.id) }),
        qc.invalidateQueries({ queryKey: customerKeys.balances() }),
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
    onSuccess: async (_, deletedId) => {
      let removed: Transaction | undefined;
      qc.setQueriesData<InfiniteData<PagedTransactions>>(
        { queryKey: [...transactionKeys.all, "customer-infinite"] },
        (old) => {
          const res = applyDeletedTransactionToInfinite(old, deletedId);
          if (res.removed) removed = res.removed;
          return res.next;
        },
      );

      if (removed) {
        const prevBalances = qc.getQueryData<CustomerBalancesMap>(
          customerKeys.balances(),
        );
        const prevOutstanding = prevBalances?.[removed.customerId]?.outstanding;
        const creditDelta = removed.type === "credit" ? -removed.amount : 0;
        const debitDelta = removed.type === "debit" ? -removed.amount : 0;
        const delta = creditDelta - debitDelta;

        qc.setQueryData<CustomerBalancesMap>(customerKeys.balances(), (old) =>
          applyBalanceDelta(old, removed!.customerId, delta),
        );
        qc.setQueryData<DashboardMetrics>(dashboardKeys.metrics(), (old) =>
          applyTransactionToDashboardMetrics(old, delta, removed!.createdAt),
        );
        qc.setQueryData<Analytics>(dashboardKeys.analytics(), (old) =>
          applyTransactionToDashboardAnalytics(old, {
            customerId: removed!.customerId,
            creditDelta,
            debitDelta,
            createdAt: removed!.createdAt,
            previousCustomerOutstanding: prevOutstanding,
          }),
        );
      }

      qc.setQueryData<Transaction[]>(
        dashboardKeys.recentTransactions(),
        (old) => old?.filter((tx) => tx.id !== deletedId),
      );

      await Promise.all([
        qc.invalidateQueries({ queryKey: transactionKeys.all }),
        qc.invalidateQueries({ queryKey: customerKeys.balances() }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
        qc.invalidateQueries({ queryKey: statementKeys.all }),
      ]);
      toast.success("Transaction deleted");
    },
    onError: (err: Error) => toast.error(formatApiError(err)),
  });
}
