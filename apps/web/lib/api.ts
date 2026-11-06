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
};

export const customersApi = {
  list: () => apiClient.get<Customer[]>("/customers").then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),

  create: (data: { name: string; phone: string }) =>
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
    customerId: string;
    amount: number;
    type: "credit" | "debit";
    note?: string;
  }) => apiClient.post<Transaction>("/transactions", data).then((r) => r.data),

  update: (
    id: string,
    data: {
      customerId?: string;
      amount?: number;
      type?: "credit" | "debit";
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
export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  deletedAt?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  customerId: string;
  amount: number;
  type: "credit" | "debit";
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
