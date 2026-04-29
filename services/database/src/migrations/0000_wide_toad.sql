CREATE TYPE "public"."chart_status" AS ENUM('Draft', 'Completed', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."tile_type" AS ENUM('Paid', 'Filler');--> statement-breakpoint
CREATE TYPE "public"."contract_tier" AS ENUM('Normal Placement', 'Premium Placement');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measure" AS ENUM('BROCH', 'MAG');--> statement-breakpoint
CREATE TYPE "public"."inventory_request_status" AS ENUM('Pending', 'Approved', 'Rejected', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."stock_level" AS ENUM('Low', 'On Target', 'Overstock');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('Delivery', 'Distribution', 'Recycle', 'Trans In', 'Trans Out', 'Return to Client', 'Adjustment', 'Start Count');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"access_token" varchar(1000),
	"refresh_token" varchar(1000),
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" varchar(500),
	"id_token" varchar(2000),
	"password" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"impersonated_by_id" text,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(255) NOT NULL,
	"user_agent" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) DEFAULT 'user',
	"image" varchar(255),
	"banned" boolean DEFAULT false,
	"ban_reason" varchar(255),
	"ban_expires" timestamp,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brochure_image_pack_sizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brochure_image_id" uuid NOT NULL,
	"units_per_box" numeric(12, 2) NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brochure_image_pack_sizes_image_units_unique" UNIQUE("brochure_image_id","units_per_box")
);
--> statement-breakpoint
CREATE TABLE "brochure_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brochure_id" uuid NOT NULL,
	"image_url" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brochure_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"col_span" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brochures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"brochure_type_id" uuid NOT NULL,
	"customer_id" uuid,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chart_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sector_id" uuid NOT NULL,
	"stand_width" integer NOT NULL,
	"stand_height" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"status" chart_status DEFAULT 'Draft' NOT NULL,
	"general_notes" text,
	"locked" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by" text,
	"archived_at" timestamp,
	"archived_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chart_layouts_sector_size_month_year_unique" UNIQUE("sector_id","stand_width","stand_height","month","year")
);
--> statement-breakpoint
CREATE TABLE "chart_tiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chart_layout_id" uuid NOT NULL,
	"col" integer NOT NULL,
	"row" integer NOT NULL,
	"col_span" integer DEFAULT 1 NOT NULL,
	"tile_type" "tile_type" NOT NULL,
	"contract_id" uuid,
	"inventory_item_id" uuid,
	"label" varchar(255),
	"cover_photo_url" varchar(500),
	"is_new" boolean DEFAULT false NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acumatica_distribution_id" varchar(100),
	"contract_id" uuid NOT NULL,
	"sector_id" uuid NOT NULL,
	"description" varchar(255),
	"beginning_date" date NOT NULL,
	"ending_date" date NOT NULL,
	"unit_of_measure" "unit_of_measure" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acumatica_contract_id" varchar(50) NOT NULL,
	"revision_number" varchar(10) DEFAULT '00001' NOT NULL,
	"customer_uuid" uuid,
	"tier" "contract_tier" DEFAULT 'Normal Placement' NOT NULL,
	"status" varchar(50) DEFAULT 'Open' NOT NULL,
	"beginning_date" date,
	"end_date" date,
	CONSTRAINT "contracts_acumatica_revision_unique" UNIQUE("acumatica_contract_id","revision_number")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acumatica_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_acumatica_id_unique" UNIQUE("acumatica_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"brochure_image_pack_size_id" uuid NOT NULL,
	"boxes" real NOT NULL,
	"stock_level" "stock_level" NOT NULL,
	"qr_code_url" varchar(500),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_warehouse_pack_size_unique" UNIQUE("warehouse_id","brochure_image_pack_size_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_transaction_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "inventory_request_status" DEFAULT 'Pending' NOT NULL,
	"warehouse_id" uuid,
	"brochure_type_id" uuid,
	"brochure_name" varchar(255),
	"customer_name" varchar(255),
	"image_url" varchar(500),
	"date_received" date NOT NULL,
	"boxes" real NOT NULL,
	"units_per_box" numeric(12, 2) NOT NULL,
	"transaction_type" "transaction_type" DEFAULT 'Delivery' NOT NULL,
	"notes" text,
	"requested_by" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"approved_inventory_item_id" uuid,
	"approved_transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"transaction_date" date NOT NULL,
	"boxes" real NOT NULL,
	"balance_before_boxes" real NOT NULL,
	"balance_after_boxes" real NOT NULL,
	"request_id" uuid,
	"transfer_group_id" uuid,
	"source_warehouse_id" uuid,
	"destination_warehouse_id" uuid,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airtable_id" varchar(50),
	"location_id" varchar(50),
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip" varchar(20) NOT NULL,
	"pockets" jsonb NOT NULL,
	"is_default_pockets" boolean DEFAULT false NOT NULL,
	"route4me_id" varchar(50),
	CONSTRAINT "locations_airtable_id_unique" UNIQUE("airtable_id"),
	CONSTRAINT "locations_location_id_unique" UNIQUE("location_id")
);
--> statement-breakpoint
CREATE TABLE "locations_sectors" (
	"location_id" uuid NOT NULL,
	"sector_id" uuid NOT NULL,
	CONSTRAINT "locations_sectors_location_id_sector_id_pk" PRIMARY KEY("location_id","sector_id")
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acumatica_id" varchar(50) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "sectors_acumatica_id_unique" UNIQUE("acumatica_id")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acumatica_id" varchar(50),
	"name" varchar(255) NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_acumatica_id_unique" UNIQUE("acumatica_id")
);
--> statement-breakpoint
CREATE TABLE "warehouses_sectors" (
	"warehouse_id" uuid NOT NULL,
	"sector_id" uuid NOT NULL,
	CONSTRAINT "warehouses_sectors_warehouse_id_sector_id_pk" PRIMARY KEY("warehouse_id","sector_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonated_by_id_user_id_fk" FOREIGN KEY ("impersonated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_image_pack_sizes" ADD CONSTRAINT "brochure_image_pack_sizes_brochure_image_id_brochure_images_id_fk" FOREIGN KEY ("brochure_image_id") REFERENCES "public"."brochure_images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_image_pack_sizes" ADD CONSTRAINT "brochure_image_pack_sizes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_images" ADD CONSTRAINT "brochure_images_brochure_id_brochures_id_fk" FOREIGN KEY ("brochure_id") REFERENCES "public"."brochures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochure_images" ADD CONSTRAINT "brochure_images_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochures" ADD CONSTRAINT "brochures_brochure_type_id_brochure_types_id_fk" FOREIGN KEY ("brochure_type_id") REFERENCES "public"."brochure_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochures" ADD CONSTRAINT "brochures_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brochures" ADD CONSTRAINT "brochures_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_layouts" ADD CONSTRAINT "chart_layouts_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_layouts" ADD CONSTRAINT "chart_layouts_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_layouts" ADD CONSTRAINT "chart_layouts_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_tiles" ADD CONSTRAINT "chart_tiles_chart_layout_id_chart_layouts_id_fk" FOREIGN KEY ("chart_layout_id") REFERENCES "public"."chart_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_tiles" ADD CONSTRAINT "chart_tiles_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_tiles" ADD CONSTRAINT "chart_tiles_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_distributions" ADD CONSTRAINT "contract_distributions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_distributions" ADD CONSTRAINT "contract_distributions_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_uuid_customers_id_fk" FOREIGN KEY ("customer_uuid") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_brochure_image_pack_size_id_brochure_image_pack_sizes_id_fk" FOREIGN KEY ("brochure_image_pack_size_id") REFERENCES "public"."brochure_image_pack_sizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_brochure_type_id_brochure_types_id_fk" FOREIGN KEY ("brochure_type_id") REFERENCES "public"."brochure_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_approved_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("approved_inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transaction_requests" ADD CONSTRAINT "inventory_transaction_requests_approved_transaction_id_inventory_transactions_id_fk" FOREIGN KEY ("approved_transaction_id") REFERENCES "public"."inventory_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations_sectors" ADD CONSTRAINT "locations_sectors_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations_sectors" ADD CONSTRAINT "locations_sectors_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses_sectors" ADD CONSTRAINT "warehouses_sectors_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses_sectors" ADD CONSTRAINT "warehouses_sectors_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "brochure_image_pack_sizes_brochure_image_id_idx" ON "brochure_image_pack_sizes" USING btree ("brochure_image_id");--> statement-breakpoint
CREATE INDEX "brochure_image_pack_sizes_units_per_box_idx" ON "brochure_image_pack_sizes" USING btree ("units_per_box");--> statement-breakpoint
CREATE INDEX "brochure_images_brochure_id_idx" ON "brochure_images" USING btree ("brochure_id");--> statement-breakpoint
CREATE INDEX "brochures_brochure_type_id_idx" ON "brochures" USING btree ("brochure_type_id");--> statement-breakpoint
CREATE INDEX "brochures_customer_id_idx" ON "brochures" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "brochures_name_idx" ON "brochures" USING btree ("name");--> statement-breakpoint
CREATE INDEX "chart_layouts_sector_size_idx" ON "chart_layouts" USING btree ("sector_id","stand_width","stand_height");--> statement-breakpoint
CREATE INDEX "chart_layouts_sector_id_idx" ON "chart_layouts" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "chart_layouts_status_idx" ON "chart_layouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chart_layouts_archived_at_idx" ON "chart_layouts" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "chart_layouts_month_year_idx" ON "chart_layouts" USING btree ("month","year");--> statement-breakpoint
CREATE INDEX "chart_tiles_layout_id_idx" ON "chart_tiles" USING btree ("chart_layout_id");--> statement-breakpoint
CREATE INDEX "distributions_contract_id_idx" ON "contract_distributions" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "distributions_sector_id_idx" ON "contract_distributions" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "contracts_acumatica_id_idx" ON "contracts" USING btree ("acumatica_contract_id");--> statement-breakpoint
CREATE INDEX "customers_acumatica_id_idx" ON "customers" USING btree ("acumatica_id");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "inventory_items_warehouse_id_idx" ON "inventory_items" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "inventory_items_pack_size_id_idx" ON "inventory_items" USING btree ("brochure_image_pack_size_id");--> statement-breakpoint
CREATE INDEX "inventory_request_status_idx" ON "inventory_transaction_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_request_requested_by_idx" ON "inventory_transaction_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "inventory_request_warehouse_id_idx" ON "inventory_transaction_requests" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "inventory_request_brochure_type_id_idx" ON "inventory_transaction_requests" USING btree ("brochure_type_id");--> statement-breakpoint
CREATE INDEX "inventory_txn_item_id_idx" ON "inventory_transactions" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "inventory_txn_transaction_date_idx" ON "inventory_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "inventory_txn_request_id_idx" ON "inventory_transactions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "inventory_txn_transfer_group_id_idx" ON "inventory_transactions" USING btree ("transfer_group_id");--> statement-breakpoint
CREATE INDEX "airtable_id_idx" ON "locations" USING btree ("airtable_id");--> statement-breakpoint
CREATE INDEX "location_id_idx" ON "locations" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "locations_sectors_location_id_idx" ON "locations_sectors" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "locations_sectors_sector_id_idx" ON "locations_sectors" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "sectors_acumatica_id_idx" ON "sectors" USING btree ("acumatica_id");--> statement-breakpoint
CREATE INDEX "warehouses_acumatica_id_idx" ON "warehouses" USING btree ("acumatica_id");--> statement-breakpoint
CREATE INDEX "warehouses_sectors_warehouse_id_idx" ON "warehouses_sectors" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "warehouses_sectors_sector_id_idx" ON "warehouses_sectors" USING btree ("sector_id");