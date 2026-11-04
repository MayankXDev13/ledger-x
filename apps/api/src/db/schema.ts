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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "credit",
  "debit",
]);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
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
    deletedAtIdx: index("customer_deleted_at_idx").on(t.deletedAt),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "cascade",
      }),
    // Store amount in paise/cents
    amount: integer("amount").notNull(),
    type: transactionTypeEnum("type").notNull(),
    note: text("note"),
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
    userIdx: index("transaction_user_idx").on(t.userId),
    typeIdx: index("transaction_type_idx").on(t.type),
    deletedAtIdx: index("transaction_deleted_at_idx").on(t.deletedAt),
  }),
);

export const transactionTags = pgTable(
  "transaction_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
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
    userIdx: index("transaction_tag_user_idx").on(t.userId),

    userNameUnique: uniqueIndex("transaction_tag_user_name_unique").on(
      t.userId,
      t.name,
    ),
  }),
);

export const transactionTagMap = pgTable(
  "transaction_tag_map",
  {
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, {
        onDelete: "cascade",
      }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => transactionTags.id, {
        onDelete: "cascade",
      }),
    createdAt: timestamp("created_at", {
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.transactionId, t.tagId],
    }),

    transactionIdx: index("transaction_tag_tx_idx").on(t.transactionId),

    tagIdx: index("transaction_tag_tag_idx").on(t.tagId),
  }),
);

/* Relations */

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
