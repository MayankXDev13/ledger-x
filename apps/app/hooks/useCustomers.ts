import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/lib/api";
import { collectionKeys, customerKeys, dashboardKeys } from "./query-keys";

export { customerKeys };

export function useCustomers(enabled = true) {
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: customersApi.list,
    enabled,
  });
}

export function useCustomerBalances(enabled = true) {
  return useQuery({
    queryKey: customerKeys.balances(),
    queryFn: customersApi.balances,
    enabled,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => customersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; phone?: string };
    }) => customersApi.update(id, data),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: customerKeys.lists() }),
        qc.invalidateQueries({ queryKey: customerKeys.detail(id) }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
      ]);
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: async (_, id) => {
      qc.removeQueries({ queryKey: customerKeys.detail(id) });
      await Promise.all([
        qc.invalidateQueries({ queryKey: customerKeys.lists() }),
        qc.invalidateQueries({ queryKey: customerKeys.balances() }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
      ]);
    },
  });
}
