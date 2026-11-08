import axios from "axios";
import { getToken } from "./auth";
import { toApiError } from "./api-error";

export { ApiError, toApiError } from "./api-error";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

export const authApi = {
  me: () =>
    apiClient
      .get<{ id: string; email: string }>("/auth/me")
      .then((r) => r.data),
};

export const dashboardApi = {
  metrics: () =>
    apiClient
      .get<{
        totalBalance: number;
        totalCustomers: number;
        monthlyNet: number;
      }>("/dashboard/metrics")
      .then((r) => r.data),

  recentTransactions: () =>
    apiClient
      .get<Transaction[]>("/dashboard/recent-transactions")
      .then((r) => r.data),

  analytics: () =>
    apiClient.get<Analytics>("/dashboard/analytics").then((r) => r.data),
};

export const booksApi = {
  get: () => apiClient.get<Book>("/books").then((r) => r.data),
};

export const settingsApi = {
  get: () => apiClient.get<UserSettings>("/settings").then((r) => r.data),

  update: (data: {
    upiId?: string | null;
    payeeName?: string | null;
    onboardingCompleted?: boolean;
    onboardingDismissed?: boolean;
  }) => apiClient.put<UserSettings>("/settings", data).then((r) => r.data),
};

export const collectionApi = {
  list: (sort: "amount" | "age" = "amount") =>
    apiClient
      .get<CollectionResponse>("/collection", { params: { sort } })
      .then((r) => r.data),
};

export const statementsApi = {
  get: (customerId: string, params?: { start?: string; end?: string }) =>
    apiClient
      .get<Statement>(`/statements/customers/${customerId}`, { params })
      .then((r) => r.data),
};

export const sampleDataApi = {
  seed: () =>
    apiClient
      .post<{ customers: Customer[]; transactions: Transaction[] }>(
        "/sample-data",
      )
      .then((r) => r.data),

  remove: () => apiClient.delete("/sample-data").then((r) => r.data),
};

export const accountApi = {
  archive: () =>
    apiClient.get<AccountArchive>("/account/export").then((r) => r.data),

  delete: () =>
    apiClient
      .delete<{ success: boolean }>("/account", {
        data: { confirm: "DELETE" },
      })
      .then((r) => r.data),
};

/** Fetch a file as a Blob and hand it to the browser as a download. */
async function downloadBlob(
  url: string,
  fallbackName: string,
  accept: string,
) {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" });
  const disposition = response.headers["content-disposition"] as
    | string
    | undefined;
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? fallbackName;

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: accept });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const exportsApi = {
  customersCsv: () =>
    downloadBlob(
      "/exports/customers.csv",
      "ledger-x-customers.csv",
      "text/csv",
    ),

  transactionsCsv: () =>
    downloadBlob(
      "/exports/transactions.csv",
      "ledger-x-transactions.csv",
      "text/csv",
    ),
};

export const customersApi = {
  list: () => apiClient.get<Customer[]>("/customers").then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),

  create: (data: { id?: string; name: string; phone: string }) =>
    apiClient.post<Customer>("/customers", data).then((r) => r.data),

  update: (id: string, data: { name?: string; phone?: string }) =>
    apiClient.put<Customer>(`/customers/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<void>(`/customers/${id}`).then((r) => r.data),
};

export const transactionsApi = {
  listByCustomer: (
    customerId: string,
    params?: { page?: number; pageSize?: number; start?: string; end?: string },
  ) =>
    apiClient
      .get<PagedTransactions>(
        `/transactions/customers/${customerId}/transactions`,
        { params },
      )
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Transaction>(`/transactions/${id}`).then((r) => r.data),

  create: (data: {
    id?: string;
    customerId: string;
    amount: number;
    type: "credit" | "debit";
    paymentMethod?: PaymentMethod | null;
    note?: string;
  }) => apiClient.post<Transaction>("/transactions", data).then((r) => r.data),

  update: (
    id: string,
    data: {
      customerId?: string;
      amount?: number;
      type?: "credit" | "debit";
      paymentMethod?: PaymentMethod | null;
      note?: string;
    },
  ) =>
    apiClient
      .put<Transaction>(`/transactions/${id}`, data)
      .then((response) => response.data),

  delete: (id: string) =>
    apiClient
      .delete<void>(`/transactions/${id}`)
      .then((response) => response.data),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentMethod = "cash" | "upi" | "other";

export interface Customer {
  id: string;
  userId: string;
  bookId?: string;
  name: string;
  phone: string;
  isSample?: boolean;
  deletedAt?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  bookId?: string;
  customerId: string;
  amount: number;
  type: "credit" | "debit";
  paymentMethod?: PaymentMethod | null;
  isSample?: boolean;
  note?: string;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  /** Cumulative post-transaction balance over the customer's full history. */
  runningBalance?: number;
}

export interface PagedTransactions {
  data: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  /** Whole-customer sums over the active filters, independent of pagination. */
  totalCredit: number;
  totalDebit: number;
  totalAmount: number;
  start?: string | null;
  end?: string | null;
}

export interface Book {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  upiId: string | null;
  payeeName: string | null;
  onboardingCompletedAt: string | null;
  onboardingDismissedAt: string | null;
}

export interface CollectionRow {
  customerId: string;
  name: string;
  phone: string;
  outstanding: number;
  oldestUnpaidCreditAt: string | null;
  ageDays: number | null;
}

export interface CollectionResponse {
  data: CollectionRow[];
  totalReceivables: number;
  sort: "amount" | "age";
}

export interface AgingBuckets {
  "0-30": number;
  "31-60": number;
  "60+": number;
}

export interface Analytics {
  trend: { month: string; credit: number; debit: number }[];
  topDebtors: {
    customerId: string;
    name: string;
    outstanding: number;
    ageDays: number | null;
  }[];
  aging: AgingBuckets;
  totalReceivables: number;
}

export interface StatementEntry {
  id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  paymentMethod: PaymentMethod | null;
  note: string | null;
  runningBalance: number;
}

export interface Statement {
  customer: { id: string; name: string; phone: string };
  start: string | null;
  end: string | null;
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
  entries: StatementEntry[];
}

export interface AccountArchive {
  exportedAt: string;
  user: { id: string; email: string };
  customers: (Customer & { deleted: boolean })[];
  transactions: (Transaction & { deleted: boolean })[];
}
