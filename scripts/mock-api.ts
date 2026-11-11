#!/usr/bin/env bun
/**
 * A local stand-in for the Ledger-X API, used only to capture screenshots.
 *
 * The real API is a Cloudflare Worker backed by Postgres. For a visual review
 * we only need the shapes the web client reads, so this serves deterministic
 * sample data for every endpoint the web app calls, and accepts any bearer
 * token.
 *
 * Run: `bun run scripts/mock-api.ts` (listens on 8787)
 */
const PORT = Number(process.env.MOCK_PORT ?? 8787);

const USER = {
  id: "user-1",
  email: "ramesh@kirana.example",
  name: "Ramesh Kumar",
  image: null,
};

const CUSTOMERS = [
  {
    id: "c1",
    userId: USER.id,
    name: "Sunita Devi",
    phone: "+91 98765 43210",
    createdAt: "2026-02-14T04:30:00.000Z",
  },
  {
    id: "c2",
    userId: USER.id,
    name: "Arun Kumar",
    phone: "+91 98765 43211",
    createdAt: "2026-03-02T04:30:00.000Z",
  },
  {
    id: "c3",
    userId: USER.id,
    name: "Meena Traders",
    phone: "+91 98765 43212",
    createdAt: "2026-04-19T04:30:00.000Z",
  },
  {
    id: "c4",
    userId: USER.id,
    name: "Rakesh Hardware",
    phone: "+91 98765 43213",
    createdAt: "2026-06-08T04:30:00.000Z",
  },
  {
    id: "c5",
    userId: USER.id,
    name: "Priya General Store",
    phone: "+91 98765 43214",
    createdAt: "2026-07-21T04:30:00.000Z",
  },
  {
    id: "c6",
    userId: USER.id,
    name: "फूल विक्रेता",
    phone: "+91 98765 43215",
    createdAt: "2026-08-30T04:30:00.000Z",
  },
];

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const TRANSACTIONS = [
  {
    id: "t1",
    userId: USER.id,
    customerId: "c1",
    amount: 1200,
    type: "credit",
    note: "Groceries",
    createdAt: daysAgo(12),
    runningBalance: 1200,
  },
  {
    id: "t2",
    userId: USER.id,
    customerId: "c1",
    amount: 500,
    type: "debit",
    paymentMethod: "cash",
    note: "Part payment",
    createdAt: daysAgo(9),
    runningBalance: 700,
  },
  {
    id: "t3",
    userId: USER.id,
    customerId: "c2",
    amount: 3400,
    type: "credit",
    note: "Monthly supplies",
    createdAt: daysAgo(21),
    runningBalance: 3400,
  },
  {
    id: "t4",
    userId: USER.id,
    customerId: "c2",
    amount: 3400,
    type: "debit",
    paymentMethod: "upi",
    note: "Settled by UPI",
    createdAt: daysAgo(20),
    runningBalance: 0,
  },
  {
    id: "t5",
    userId: USER.id,
    customerId: "c3",
    amount: 8750,
    type: "credit",
    note: "Stock order",
    createdAt: daysAgo(38),
    runningBalance: 8750,
  },
  {
    id: "t6",
    userId: USER.id,
    customerId: "c4",
    amount: 2150,
    type: "credit",
    note: "Paint and brushes",
    createdAt: daysAgo(66),
    runningBalance: 2150,
  },
  {
    id: "t7",
    userId: USER.id,
    customerId: "c5",
    amount: 640,
    type: "credit",
    note: "Snacks",
    createdAt: daysAgo(4),
    runningBalance: 640,
  },
  {
    id: "t8",
    userId: USER.id,
    customerId: "c5",
    amount: 640,
    type: "debit",
    paymentMethod: "upi",
    note: "Paid by UPI",
    createdAt: daysAgo(3),
    runningBalance: 0,
  },
  {
    id: "t9",
    userId: USER.id,
    customerId: "c3",
    amount: 1500,
    type: "debit",
    paymentMethod: "cash",
    note: "Cash received",
    createdAt: daysAgo(2),
    runningBalance: 7250,
  },
  {
    id: "t10",
    userId: USER.id,
    customerId: "c6",
    amount: 950,
    type: "credit",
    note: "Bouquet order",
    createdAt: daysAgo(1),
    runningBalance: 950,
  },
];

const COLLECTION = [
  {
    customerId: "c3",
    name: "Meena Traders",
    phone: "+91 98765 43212",
    outstanding: 7250,
    oldestUnpaidCreditAt: daysAgo(38),
    ageDays: 38,
  },
  {
    customerId: "c4",
    name: "Rakesh Hardware",
    phone: "+91 98765 43213",
    outstanding: 2150,
    oldestUnpaidCreditAt: daysAgo(66),
    ageDays: 66,
  },
  {
    customerId: "c1",
    name: "Sunita Devi",
    phone: "+91 98765 43210",
    outstanding: 700,
    oldestUnpaidCreditAt: daysAgo(12),
    ageDays: 12,
  },
  {
    customerId: "c6",
    name: "फूल विक्रेता",
    phone: "+91 98765 43215",
    outstanding: 950,
    oldestUnpaidCreditAt: daysAgo(1),
    ageDays: 1,
  },
];

const trend = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 10 - index, 1));
  const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const credit = [4200, 3100, 8600, 5400, 2250, 9700, 6400, 11200, 7350, 4800, 9100, 6450][index];
  const debit = [1800, 2600, 3100, 900, 4200, 2600, 5300, 3100, 4800, 2200, 3600, 2900][index];
  return { month, credit, debit };
});

const ANALYTICS = {
  trend,
  topDebtors: COLLECTION.map((row) => ({
    customerId: row.customerId,
    name: row.name,
    outstanding: row.outstanding,
    ageDays: row.ageDays,
  })),
  aging: { "0-30": 1650, "31-60": 7250, "60+": 2150 },
  totalReceivables: 11050,
};

const SETTINGS = {
  upiId: "rameshkirana@okhdfcbank",
  payeeName: "Ramesh Kirana Store",
  onboardingCompletedAt: "2026-09-01T04:30:00.000Z",
  onboardingDismissedAt: null,
};

function json(body: unknown, status = 200, request?: Request) {
  // The web client calls the session endpoint with `credentials: "include"`,
  // and a wildcard origin is rejected by the browser for a credentialed
  // request. Echo the request origin and allow credentials instead.
  const origin = request?.headers.get("origin");
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-credentials"] = "true";
    headers["vary"] = "Origin";
  } else {
    headers["access-control-allow-origin"] = "*";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const reply = (body: unknown, status = 200) => json(body, status, request);

    if (method === "OPTIONS") return reply({}, 204);

    /* Better Auth session */
    if (path === "/api/auth/get-session") {
      return reply({
        session: {
          id: "session-1",
          userId: USER.id,
          token: "mock-token",
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
        user: USER,
      });
    }
    if (path.startsWith("/api/auth/")) return reply({});

    /* API */
    if (path === "/auth/me") return reply(USER);
    if (path === "/books") {
      return reply({
        id: "book-1",
        userId: USER.id,
        name: "Main Ledger",
        isDefault: true,
      });
    }
    if (path === "/settings") return reply(SETTINGS);
    if (path === "/dashboard/metrics") {
      return reply({
        totalBalance: 11050,
        totalCustomers: CUSTOMERS.length,
        monthlyNet: 3320,
      });
    }
    if (path === "/dashboard/recent-transactions") {
      return reply(TRANSACTIONS.slice(0, 5));
    }
    if (path === "/dashboard/analytics") return reply(ANALYTICS);
    if (path === "/collection") {
      return reply({
        data: COLLECTION,
        totalReceivables: 11050,
        sort: url.searchParams.get("sort") === "age" ? "age" : "amount",
      });
    }
    if (path === "/customers") return reply(CUSTOMERS);
    if (path.startsWith("/customers/")) {
      const id = path.split("/")[2];
      const customer = CUSTOMERS.find((c) => c.id === id);
      return customer ? reply(customer) : reply({ error: "Not found" }, 404);
    }
    if (path.startsWith("/statements/customers/")) {
      const id = path.split("/")[3];
      const customer = CUSTOMERS.find((c) => c.id === id) ?? CUSTOMERS[0];
      const entries = TRANSACTIONS.filter((t) => t.customerId === customer.id);
      const totalCredit = entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + e.amount, 0);
      const totalDebit = entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + e.amount, 0);
      return reply({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        },
        start: null,
        end: null,
        openingBalance: 0,
        closingBalance: totalCredit - totalDebit,
        totalCredit,
        totalDebit,
        entries: entries.map((entry) => ({
          id: entry.id,
          date: entry.createdAt,
          type: entry.type,
          amount: entry.amount,
          paymentMethod: entry.paymentMethod ?? null,
          note: entry.note ?? null,
          runningBalance: entry.runningBalance ?? 0,
        })),
      });
    }
    if (path.includes("/transactions")) {
      const id = path.split("/")[3];
      const entries = TRANSACTIONS.filter((t) => t.customerId === id);
      const totalCredit = entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + e.amount, 0);
      const totalDebit = entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + e.amount, 0);
      return reply({
        data: entries,
        page: 1,
        pageSize: 100,
        total: entries.length,
        totalCredit,
        totalDebit,
        totalAmount: totalCredit + totalDebit,
      });
    }

    return reply({ error: "Not found" }, 404);
  },
});

console.log(`mock API listening on http://127.0.0.1:${server.port}`);
