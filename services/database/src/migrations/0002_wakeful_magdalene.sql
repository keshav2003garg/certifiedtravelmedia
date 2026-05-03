ALTER TABLE "account" DROP CONSTRAINT "account_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_impersonated_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "brochure_image_pack_sizes" DROP CONSTRAINT "brochure_image_pack_sizes_brochure_image_id_brochure_images_id_fk";
--> statement-breakpoint
ALTER TABLE "brochure_image_pack_sizes" DROP CONSTRAINT "brochure_image_pack_sizes_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "brochure_images" DROP CONSTRAINT "brochure_images_brochure_id_brochures_id_fk";
--> statement-breakpoint
ALTER TABLE "brochure_images" DROP CONSTRAINT "brochure_images_uploaded_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "brochures" DROP CONSTRAINT "brochures_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "brochures" DROP CONSTRAINT "brochures_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "chart_layouts" DROP CONSTRAINT "chart_layouts_completed_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "chart_layouts" DROP CONSTRAINT "chart_layouts_archived_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_customer_uuid_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" DROP CONSTRAINT "inventory_transaction_requests_requested_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" DROP CONSTRAINT "inventory_transaction_requests_reviewed_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonated_by_id_user_id_fk" FOREIGN KEY ("impersonated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_image_pack_sizes" ADD CONSTRAINT "brochure_image_pack_sizes_brochure_image_id_brochure_images_id_fk" FOREIGN KEY ("brochure_image_id") REFERENCES "public"."brochure_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_image_pack_sizes" ADD CONSTRAINT "brochure_image_pack_sizes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_images" ADD CONSTRAINT "brochure_images_brochure_id_brochures_id_fk" FOREIGN KEY ("brochure_id") REFERENCES "public"."brochures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_images" ADD CONSTRAINT "brochure_images_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochures" ADD CONSTRAINT "brochures_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochures" ADD CONSTRAINT "brochures_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_layouts" ADD CONSTRAINT "chart_layouts_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_layouts" ADD CONSTRAINT "chart_layouts_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_uuid_customers_id_fk" FOREIGN KEY ("customer_uuid") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;