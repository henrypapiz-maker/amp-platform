CREATE TABLE "dimension_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"gate_code" text NOT NULL,
	"dimension_name" text NOT NULL,
	"test_guidance" text,
	"acceptance_params" jsonb,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "dimension_criteria" ADD CONSTRAINT "dimension_criteria_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dimension_criteria" ADD CONSTRAINT "dimension_criteria_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dim_criteria_idx" ON "dimension_criteria" USING btree ("org_id","gate_code","dimension_name");