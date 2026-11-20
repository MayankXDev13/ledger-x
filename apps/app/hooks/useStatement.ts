import { useQuery } from "@tanstack/react-query";
import { statementsApi } from "@/lib/api";
import { statementKeys } from "./query-keys";

export { statementKeys };

export function useStatement(
  customerId: string | undefined,
  params?: { start?: string; end?: string },
) {
  return useQuery({
    queryKey: statementKeys.customer(customerId ?? "", params),
    queryFn: () => statementsApi.get(customerId!, params),
    enabled: Boolean(customerId),
  });
}
