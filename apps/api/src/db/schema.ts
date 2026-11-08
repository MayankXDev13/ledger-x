import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  primaryKey,
  pgEnum,
  uuid,
  uniqueIndex,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "credit",
  "debit",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "other",
]);

/* Better Auth tables generated via `bunx @better-auth/cli generate`
   (config: src/lib/better-auth.ts). Do not hand-edit: re-run the CLI.
   IDs are text carrying the migrated Supabase UUID string so user_id links survive. */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("My Ledger"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("books_user_idx").on(t.userId),
    // One default book per user; additional books are allowed later.
    defaultUniqueIdx: uniqueIndex("books_user_default_idx")
      .on(t.userId)
      .where(sql`${t.isDefault}`),
  }),
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  upiId: text("upi_id"),
  payeeName: text("payee_name"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: "date" }),
  onboardingDismissedAt: timestamp("onboarding_dismissed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    actorIdx: index("audit_actor_idx").on(t.actorUserId),
    entityIdx: index("audit_entity_idx").on(t.entityType, t.entityId),
    createdIdx: index("audit_created_idx").on(t.createdAt),
  })
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: timestamp("created_at", {
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", {
      mode: "date",
    }),
  },
  (t) => ({
    userIdx: index("customer_user_idx").on(t.userId),
    bookIdx: index("customer_book_idx").on(t.bookId),
    deletedAtIdx: index("customer_deleted_at_idx").on(t.deletedAt),
    sampleIdx: index("customer_user_sample_idx").on(t.userId, t.isSample),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "cascade",
      }),
    // Store amount in paise/cents
    amount: integer("amount").notNull(),
    type: transactionTypeEnum("type").notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    note: text("note"),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: timestamp("created_at", {
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", {
      mode: "date",
    }),
  },
  (t) => ({
    customerIdx: index("transaction_customer_idx").on(t.customerId),
    customerCreatedIdx: index("transaction_customer_created_idx").on(
      t.customerId,
      t.createdAt,
    ),
    userIdx: index("transaction_user_idx").on(t.userId),
    typeIdx: index("transaction_type_idx").on(t.type),
    deletedAtIdx: index("transaction_deleted_at_idx").on(t.deletedAt),
    sampleIdx: index("transaction_user_sample_idx").on(t.userId, t.isSample),
  }),
);

/* Relations */

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(user, {
    fields: [books.userId],
    references: [user.id],
  }),
  customers: many(customers),
  transactions: many(transactions),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  book: one(books, {
    fields: [customers.bookId],
    references: [books.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  book: one(books, {
    fields: [transactions.bookId],
    references: [books.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
}));
