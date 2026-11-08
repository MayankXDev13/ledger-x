"use client";

import { useQuery } from "@tanstack/react-query";
import { statementsApi } from "@/lib/api";

export const statementKeys = {
  all: ["statements"] as const,
  customer: (
    customerId: string,
    params?: { start?: string; end?: string },
  ) => [...statementKeys.all, customerId, params ?? {}] as const,
};

export function useStatement(
  customerId: string,
  params?: { start?: string; end?: string },
) {
  return useQuery({
    queryKey: statementKeys.customer(customerId, params),
    queryFn: () => statementsApi.get(customerId, params),
    enabled: !!customerId,
  });
}
