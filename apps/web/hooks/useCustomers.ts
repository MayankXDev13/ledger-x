"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi, type Customer } from "@/lib/api";
import { toast } from "sonner";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: customersApi.list,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success("Customer created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; phone?: string } }) =>
      customersApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
      toast.success("Customer updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success("Customer deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
