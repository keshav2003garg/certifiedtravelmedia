CREATE TYPE "public"."old_inventory_item_migration_target" AS ENUM('inventory_item', 'inventory_transaction_request');--> statement-breakpoint
CREATE TABLE "old_inventory_item_mappings" (
	"old_inventory_item_id" uuid PRIMARY KEY NOT NULL,
	"new_inventory_item_id" uuid,
	"inventory_transaction_id" uuid,
	"inventory_transaction_request_id" uuid,
	"brochure_id" uuid,
	"brochure_image_id" uuid,
	"brochure_image_pack_size_id" uuid,
	"migrated_as" "old_inventory_item_migration_target" NOT NULL,
	"source_status" text,
	"source_transaction_type" text,
	"migration_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "old_inventory_item_mappings" ADD CONSTRAINT "old_inventory_item_mappings_new_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("new_inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_inventory_item_mappings" ADD CONSTRAINT "old_inventory_item_mappings_inventory_transaction_id_inventory_transactions_id_fk" FOREIGN KEY ("inventory_transaction_id") REFERENCES "public"."inventory_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_inventory_item_mappings" ADD CONSTRAINT "old_inventory_item_mappings_inventory_transaction_request_id_inventory_transaction_requests_id_fk" FOREIGN KEY ("inventory_transaction_request_id") REFERENCES "public"."inventory_transaction_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_inventory_item_mappings" ADD CONSTRAINT "old_inventory_item_mappings_brochure_id_brochures_id_fk" FOREIGN KEY ("brochure_id") REFERENCES "public"."brochures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_inventory_item_mappings" ADD CONSTRAINT "old_inventory_item_mappings_brochure_image_id_brochure_images_id_fk" FOREIGN KEY ("brochure_image_id") REFERENCES "public"."brochure_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "old_inventory_item_mappings" ADD CONSTRAINT "old_inventory_item_mappings_brochure_image_pack_size_id_brochure_image_pack_sizes_id_fk" FOREIGN KEY ("brochure_image_pack_size_id") REFERENCES "public"."brochure_image_pack_sizes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "old_inventory_item_mappings_new_item_idx" ON "old_inventory_item_mappings" USING btree ("new_inventory_item_id");--> statement-breakpoint
CREATE INDEX "old_inventory_item_mappings_transaction_idx" ON "old_inventory_item_mappings" USING btree ("inventory_transaction_id");--> statement-breakpoint
CREATE INDEX "old_inventory_item_mappings_request_idx" ON "old_inventory_item_mappings" USING btree ("inventory_transaction_request_id");--> statement-breakpoint
CREATE INDEX "old_inventory_item_mappings_pack_size_idx" ON "old_inventory_item_mappings" USING btree ("brochure_image_pack_size_id");--> statement-breakpoint
CREATE INDEX "old_inventory_item_mappings_migrated_as_idx" ON "old_inventory_item_mappings" USING btree ("migrated_as");--> statement-breakpoint
ALTER TABLE "inventory_month_end_counts" DROP COLUMN "notes";