ALTER TABLE "inventory_month_end_counts" DROP CONSTRAINT "inventory_month_end_counts_distribution_transaction_id_inventory_transactions_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP CONSTRAINT "inventory_month_end_counts_counted_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" RENAME COLUMN "counted_boxes" TO "end_count";--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP COLUMN "balance_before_boxes";--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP COLUMN "distribution_boxes";--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP COLUMN "balance_after_boxes";--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP COLUMN "distribution_transaction_id";--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP COLUMN "counted_by";