import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountApi, exportsApi, sampleDataApi } from "@/lib/api";
import {
  collectionKeys,
  customerKeys,
  dashboardKeys,
  settingsKeys,
  statementKeys,
  transactionKeys,
} from "./query-keys";

function useInvalidateAccountData() {
  const qc = useQueryClient();

  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: customerKeys.all }),
      qc.invalidateQueries({ queryKey: transactionKeys.all }),
      qc.invalidateQueries({ queryKey: dashboardKeys.all }),
      qc.invalidateQueries({ queryKey: collectionKeys.all }),
      qc.invalidateQueries({ queryKey: settingsKeys.all }),
      qc.invalidateQueries({ queryKey: statementKeys.all }),
    ]);
}

export function useExportCsv() {
  return useMutation({
    mutationFn: (kind: "customers" | "transactions") =>
      kind === "customers"
        ? exportsApi.customersCsv()
        : exportsApi.transactionsCsv(),
  });
}

export function useAccountArchive() {
  return useMutation({
    mutationFn: () => accountApi.archive(),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accountApi.delete(),
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useSeedSampleData() {
  const invalidate = useInvalidateAccountData();
  return useMutation({
    mutationFn: () => sampleDataApi.seed(),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useRemoveSampleData() {
  const invalidate = useInvalidateAccountData();
  return useMutation({
    mutationFn: () => sampleDataApi.remove(),
    onSuccess: async () => {
      await invalidate();
    },
  });
}
