CREATE INDEX "customer_deleted_at_idx" ON "customers" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "transaction_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transaction_deleted_at_idx" ON "transactions" USING btree ("deleted_at");