CREATE TYPE "public"."payment_method" AS ENUM('cash', 'upi', 'other');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'My Ledger' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"upi_id" text,
	"payee_name" text,
	"onboarding_completed_at" timestamp,
	"onboarding_dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "book_id" uuid;
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "book_id" uuid;
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" "payment_method";
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO "books" ("user_id", "name", "is_default")
SELECT "id", 'My Ledger', true FROM "user";
--> statement-breakpoint
UPDATE "customers"
SET "book_id" = "books"."id"
FROM "books"
WHERE "books"."user_id" = "customers"."user_id"
	AND "books"."is_default";
--> statement-breakpoint
UPDATE "transactions"
SET "book_id" = "books"."id"
FROM "books"
WHERE "books"."user_id" = "transactions"."user_id"
	AND "books"."is_default";
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "book_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "book_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "books_user_idx" ON "books" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "books_user_default_idx" ON "books" USING btree ("user_id") WHERE "books"."is_default";
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "customer_book_idx" ON "customers" USING btree ("book_id");
--> statement-breakpoint
CREATE INDEX "customer_user_sample_idx" ON "customers" USING btree ("user_id","is_sample");
--> statement-breakpoint
CREATE INDEX "transaction_customer_created_idx" ON "transactions" USING btree ("customer_id","created_at");
--> statement-breakpoint
CREATE INDEX "transaction_user_sample_idx" ON "transactions" USING btree ("user_id","is_sample");
