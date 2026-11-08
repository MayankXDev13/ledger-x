"use client";

import { useQuery } from "@tanstack/react-query";
import { collectionApi } from "@/lib/api";

export const collectionKeys = {
  all: ["collection"] as const,
  list: (sort: "amount" | "age") =>
    [...collectionKeys.all, "list", sort] as const,
};

export function useCollection(sort: "amount" | "age" = "amount") {
  return useQuery({
    queryKey: collectionKeys.list(sort),
    queryFn: () => collectionApi.list(sort),
  });
}
