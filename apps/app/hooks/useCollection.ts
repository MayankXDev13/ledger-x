import { useQuery } from "@tanstack/react-query";
import { collectionApi } from "@/lib/api";
import { collectionKeys } from "./query-keys";

export { collectionKeys };

export function useCollection(
  sort: "amount" | "age" = "amount",
  enabled = true,
) {
  return useQuery({
    queryKey: collectionKeys.list(sort),
    queryFn: () => collectionApi.list(sort),
    enabled,
  });
}
