CREATE TABLE "inventory_month_end_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"counted_boxes" real NOT NULL,
	"balance_before_boxes" real NOT NULL,
	"distribution_boxes" real NOT NULL,
	"balance_after_boxes" real NOT NULL,
	"distribution_transaction_id" uuid,
	"notes" text,
	"counted_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_month_end_counts_item_month_year_unique" UNIQUE("inventory_item_id","month","year")
);
--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" ADD CONSTRAINT "inventory_month_end_counts_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" ADD CONSTRAINT "inventory_month_end_counts_distribution_transaction_id_inventory_transactions_id_fk" FOREIGN KEY ("distribution_transaction_id") REFERENCES "public"."inventory_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" ADD CONSTRAINT "inventory_month_end_counts_counted_by_user_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_month_end_counts_item_id_idx" ON "inventory_month_end_counts" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "inventory_month_end_counts_period_idx" ON "inventory_month_end_counts" USING btree ("year","month");