ALTER TABLE "chart_custom_fillers" DROP CONSTRAINT "chart_custom_fillers_customer_id_customers_id_fk";
--> statement-breakpoint
DROP INDEX "chart_custom_fillers_customer_id_idx";--> statement-breakpoint
ALTER TABLE "chart_custom_fillers" DROP COLUMN "customer_id";