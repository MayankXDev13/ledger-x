import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { transactionsApi, type PaymentMethod } from "@/lib/api";
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
    onSuccess: async () => {
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
