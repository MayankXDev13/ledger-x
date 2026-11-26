import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  transactionsApi,
  type Analytics,
  type DashboardMetrics,
  type PagedTransactions,
  type PaymentMethod,
  type Transaction,
} from "@/lib/api";
import {
  applyBalanceDelta,
  applyDeletedTransactionToInfinite,
  applyTransactionToDashboardAnalytics,
  applyTransactionToDashboardMetrics,
  applyUpdatedTransactionToInfinite,
  type CustomerBalancesMap,
} from "@/lib/transaction-cache";
import {
  collectionKeys,
  customerKeys,
  dashboardKeys,
  statementKeys,
  transactionKeys,
} from "./query-keys";

export { transactionKeys };

export function useCustomerTransactions(
  customerId: string | undefined,
  params?: { page?: number; pageSize?: number; start?: string; end?: string },
) {
  return useQuery({
    queryKey: transactionKeys.byCustomer(customerId ?? "", params),
    queryFn: () => transactionsApi.listByCustomer(customerId!, params),
    enabled: Boolean(customerId),
  });
}

export function useInfiniteCustomerTransactions(
  customerId: string | undefined,
  params?: { pageSize?: number; start?: string; end?: string },
) {
  const pageSize = params?.pageSize ?? 20;
  const normalizedParams = {
    pageSize,
    start: params?.start,
    end: params?.end,
  };
  return useInfiniteQuery({
    queryKey: transactionKeys.byCustomerInfinite(
      customerId ?? "",
      normalizedParams,
    ),
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.listByCustomer(customerId!, {
        page: pageParam,
        pageSize: normalizedParams.pageSize,
        start: normalizedParams.start,
        end: normalizedParams.end,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, page) => sum + page.data.length, 0);
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(customerId),
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
        paymentMethod?: PaymentMethod | null;
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
          const res = applyUpdatedTransactionToInfinite(old, updated);
          if (res.balanceDelta !== 0) {
            balanceDelta = res.balanceDelta;
            creditDelta = res.creditDelta;
            debitDelta = res.debitDelta;
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
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
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
    },
  });
}
