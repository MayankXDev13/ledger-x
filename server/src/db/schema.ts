import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),

    userId: text("user_id").notNull(),

    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),

    amount: integer("amount").notNull(),

    type: text("type", {
      enum: ["credit", "debit"],
    }).notNull(),

    note: text("note"),

    createdAt: integer("created_at", {
      mode: "timestamp",
    }).notNull(),

    updatedAt: integer("updated_at", {
      mode: "timestamp",
    }).notNull(),

    deletedAt: integer("deleted_at", {
      mode: "timestamp",
    }),
  },
  (table) => ({
    customerIdx: index("transaction_customer_idx").on(table.customerId),
    userIdx: index("transaction_user_idx").on(table.userId),
  }),
);

export const transactionTags = sqliteTable("transaction_tags", {
  id: text("id").primaryKey(),

  userId: text("user_id").notNull(),

  name: text("name").notNull(),
  color: text("color"),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull(),

  updatedAt: integer("updated_at", {
    mode: "timestamp",
  }).notNull(),
});

export const transactionTagMap = sqliteTable(
  "transaction_tag_map",
  {
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, {
        onDelete: "cascade",
      }),

    tagId: text("tag_id")
      .notNull()
      .references(() => transactionTags.id, {
        onDelete: "cascade",
      }),

    createdAt: integer("created_at", {
      mode: "timestamp",
    }).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.transactionId, table.tagId],
    }),
    transactionIdx: index("transaction_tag_tx_idx").on(table.transactionId),
    tagIdx: index("transaction_tag_tag_idx").on(table.tagId),
  }),
);

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [transactions.customerId],
      references: [customers.id],
    }),
    transactionTagMap: many(transactionTagMap),
  }),
);

export const transactionTagsRelations = relations(
  transactionTags,
  ({ many }) => ({
    transactionTagMap: many(transactionTagMap),
  }),
);

export const transactionTagMapRelations = relations(
  transactionTagMap,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionTagMap.transactionId],
      references: [transactions.id],
    }),
    tag: one(transactionTags, {
      fields: [transactionTagMap.tagId],
      references: [transactionTags.id],
    }),
  }),
);
