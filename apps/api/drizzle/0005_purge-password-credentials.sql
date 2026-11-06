UPDATE "user" SET "email_verified" = true WHERE "id" IN (SELECT "user_id" FROM "account" WHERE "provider_id" = 'credential');--> statement-breakpoint
DELETE FROM "account" WHERE "provider_id" = 'credential';
