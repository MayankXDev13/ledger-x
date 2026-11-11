CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "feature_flags" ("key", "enabled", "label", "description") VALUES
	('collection', true, 'Collection view', 'Who owes you, how much, and for how long. Hides the Collection tab and the collection screen.'),
	('upi_collection', true, 'UPI collections', 'Your UPI ID and payee name, and the UPI QR codes and payment links built from them.');
