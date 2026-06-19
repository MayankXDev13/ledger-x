"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "@/lib/api";
import { toast } from "sonner";

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
};

export function useTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: tagsApi.list,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      toast.success("Tag created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      toast.success("Tag updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      toast.success("Tag deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
