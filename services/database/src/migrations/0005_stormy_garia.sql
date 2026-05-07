CREATE TABLE "chart_custom_fillers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_by" text,
	"deleted_at" timestamp,
	"deleted_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chart_tiles" ADD COLUMN "custom_filler_id" uuid;--> statement-breakpoint
ALTER TABLE "chart_custom_fillers" ADD CONSTRAINT "chart_custom_fillers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_custom_fillers" ADD CONSTRAINT "chart_custom_fillers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_custom_fillers" ADD CONSTRAINT "chart_custom_fillers_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chart_custom_fillers_name_idx" ON "chart_custom_fillers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "chart_custom_fillers_customer_id_idx" ON "chart_custom_fillers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "chart_custom_fillers_deleted_at_idx" ON "chart_custom_fillers" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "chart_tiles" ADD CONSTRAINT "chart_tiles_custom_filler_id_chart_custom_fillers_id_fk" FOREIGN KEY ("custom_filler_id") REFERENCES "public"."chart_custom_fillers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chart_tiles_custom_filler_id_idx" ON "chart_tiles" USING btree ("custom_filler_id");