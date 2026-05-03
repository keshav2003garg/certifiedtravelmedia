ALTER TABLE "inventory_items" ALTER COLUMN "stock_level" SET DEFAULT 'On Target';--> statement-breakpoint
ALTER TABLE "inventory_items" DROP COLUMN "notes";