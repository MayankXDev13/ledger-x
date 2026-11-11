"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  accountApi,
  exportsApi,
  sampleDataApi,
} from "@/lib/api";
import { toast } from "sonner";
import { customerKeys } from "./useCustomers";
import { transactionKeys } from "./useTransactions";
import { dashboardKeys } from "./useDashboard";
import { collectionKeys } from "./useCollection";
import { settingsKeys } from "./useSettings";
import { statementKeys } from "./useStatement";

function useInvalidateAccountData() {
  const qc = useQueryClient();

  return () => {
    for (const key of [
      customerKeys.all,
      transactionKeys.all,
      dashboardKeys.all,
      collectionKeys.all,
      settingsKeys.all,
      statementKeys.all,
    ]) {
      qc.invalidateQueries({ queryKey: key });
    }
  };
}

export function useExportCustomers() {
  return useMutation({
    mutationFn: exportsApi.customersCsv,
    onSuccess: () => toast.success("Customers CSV downloaded"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExportTransactions() {
  return useMutation({
    mutationFn: exportsApi.transactionsCsv,
    onSuccess: () => toast.success("Transactions CSV downloaded"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDownloadArchive() {
  return useMutation({
    mutationFn: async () => {
      const archive = await accountApi.archive();
      const blob = new Blob([JSON.stringify(archive, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ledger-x-archive-${archive.exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Account archive downloaded"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: accountApi.delete,
    onSuccess: () => toast.success("Account deleted"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSeedSampleData() {
  const invalidate = useInvalidateAccountData();

  return useMutation({
    mutationFn: sampleDataApi.seed,
    onSuccess: () => {
      invalidate();
      toast.success("Sample data loaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveSampleData() {
  const invalidate = useInvalidateAccountData();

  return useMutation({
    mutationFn: sampleDataApi.remove,
    onSuccess: () => {
      invalidate();
      toast.success("Sample data removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
