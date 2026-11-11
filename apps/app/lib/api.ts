// Typed client for the Ledger-X Workers API. Auth uses the Better Auth
// session token from `@/lib/auth-session`; the mobile app no longer talks to
// Supabase for ledger data.
import { getAuthHeaders } from "./auth-session";
import {
  formatApiErrorMessage,
  type ApiErrorDetails,
} from "./api-error";

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error("EXPO_PUBLIC_API_URL is not set");
  return url.replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetails;

  constructor(
    status: number,
    message: string,
    details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
  };

  const response = await fetch(`${baseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let details: ApiErrorDetails | undefined;
    try {
      const payload = (await response.json()) as {
        error?: string;
        details?: ApiErrorDetails;
      };
      if (payload?.error) message = payload.error;
      details = payload?.details;
      // The envelope error alone rarely says what to fix, so the field
      // details ride along with it.
      message = formatApiErrorMessage(message, details);
    } catch {
      // Non-JSON error bodies fall back to the status message.
    }
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function requestText(path: string): Promise<string> {
  const response = await fetch(`${baseUrl()}${path}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new ApiError(response.status, `Request failed (${response.status})`);
  }
  return response.text();
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentMethod = "cash" | "upi" | "other";

export interface Customer {
  id: string;
  userId: string;
  bookId?: string;
  name: string;
  phone: string;
  isSample?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
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
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  runningBalance?: number;
}

export interface PagedTransactions {
  data: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totalCredit: number;
  totalDebit: number;
  totalAmount: number;
  start?: string | null;
  end?: string | null;
}

export interface DashboardMetrics {
  totalBalance: number;
  totalCustomers: number;
  monthlyNet: number;
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
  /** True while a queued write still has to reach the server. */
  pending?: boolean;
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

// ─── Endpoints ────────────────────────────────────────────────────────────────
export const customersApi = {
  list: () => request<Customer[]>("/customers"),

  get: (id: string) => request<Customer>(`/customers/${id}`),

  create: (data: { id?: string; name: string; phone: string }) =>
    request<Customer>("/customers", { method: "POST", body: data }),

  update: (id: string, data: { name?: string; phone?: string }) =>
    request<Customer>(`/customers/${id}`, { method: "PUT", body: data }),

  remove: (id: string) =>
    request<{ success: boolean }>(`/customers/${id}`, { method: "DELETE" }),
};

export const transactionsApi = {
  listByCustomer: (
    customerId: string,
    params?: { page?: number; pageSize?: number; start?: string; end?: string },
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.start) query.set("start", params.start);
    if (params?.end) query.set("end", params.end);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<PagedTransactions>(
      `/transactions/customers/${customerId}/transactions${suffix}`,
    );
  },

  get: (id: string) => request<Transaction>(`/transactions/${id}`),

  create: (data: {
    id?: string;
    customerId: string;
    amount: number;
    type: "credit" | "debit";
    paymentMethod?: PaymentMethod | null;
    note?: string;
  }) => request<Transaction>("/transactions", { method: "POST", body: data }),

  update: (
    id: string,
    data: {
      customerId?: string;
      amount?: number;
      type?: "credit" | "debit";
      paymentMethod?: PaymentMethod | null;
      note?: string;
    },
  ) => request<Transaction>(`/transactions/${id}`, { method: "PUT", body: data }),

  remove: (id: string) =>
    request<{ success: boolean }>(`/transactions/${id}`, { method: "DELETE" }),
};

export const featureFlagsApi = {
  get: () =>
    request<{ flags: Record<string, boolean> }>("/feature-flags").then(
      (r) => r.flags,
    ),
};

export const dashboardApi = {
  metrics: () => request<DashboardMetrics>("/dashboard/metrics"),

  recentTransactions: () => request<Transaction[]>("/dashboard/recent-transactions"),

  analytics: () => request<Analytics>("/dashboard/analytics"),
};

export const settingsApi = {
  get: () => request<UserSettings>("/settings"),

  update: (data: {
    upiId?: string | null;
    payeeName?: string | null;
    onboardingCompleted?: boolean;
    onboardingDismissed?: boolean;
  }) => request<UserSettings>("/settings", { method: "PUT", body: data }),
};

export const collectionApi = {
  list: (sort: "amount" | "age" = "amount") =>
    request<CollectionResponse>(`/collection?sort=${sort}`),
};

export const statementsApi = {
  get: (customerId: string, params?: { start?: string; end?: string }) => {
    const query = new URLSearchParams();
    if (params?.start) query.set("start", params.start);
    if (params?.end) query.set("end", params.end);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Statement>(`/statements/customers/${customerId}${suffix}`);
  },
};

export const sampleDataApi = {
  seed: () =>
    request<{ customers: Customer[]; transactions: Transaction[] }>(
      "/sample-data",
      { method: "POST" },
    ),

  remove: () =>
    request<{ success: boolean }>("/sample-data", { method: "DELETE" }),
};

export const accountApi = {
  archive: () => request<AccountArchive>("/account/export"),

  delete: () =>
    request<{ success: boolean }>("/account", {
      method: "DELETE",
      body: { confirm: "DELETE" },
    }),
};

export const exportsApi = {
  customersCsv: () => requestText("/exports/customers.csv"),

  transactionsCsv: () => requestText("/exports/transactions.csv"),
};

export const booksApi = {
  get: () =>
    request<{
      id: string;
      userId: string;
      name: string;
      isDefault: boolean;
    }>("/books"),
};
