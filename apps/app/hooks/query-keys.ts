export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  recentTransactions: () =>
    [...dashboardKeys.all, "recent-transactions"] as const,
  analytics: () => [...dashboardKeys.all, "analytics"] as const,
};

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  balances: () => [...customerKeys.all, "balances"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export const transactionKeys = {
  all: ["transactions"] as const,
  byCustomer: (customerId: string, params?: object) =>
    params
      ? ([...transactionKeys.all, "customer", customerId, params] as const)
      : ([...transactionKeys.all, "customer", customerId] as const),
  byCustomerInfinite: (customerId: string, params?: object) =>
    params
      ? ([
          ...transactionKeys.all,
          "customer-infinite",
          customerId,
          params,
        ] as const)
      : ([...transactionKeys.all, "customer-infinite", customerId] as const),
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};

export const collectionKeys = {
  all: ["collection"] as const,
  list: (sort: "amount" | "age") =>
    [...collectionKeys.all, "list", sort] as const,
};

export const statementKeys = {
  all: ["statements"] as const,
  customer: (
    customerId: string,
    params?: { start?: string; end?: string },
  ) => [...statementKeys.all, customerId, params ?? {}] as const,
};

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export const featureFlagKeys = {
  all: ["feature-flags"] as const,
};
