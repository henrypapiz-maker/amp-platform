CREATE TABLE "gate_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid,
	"user_id" uuid,
	"decision" text NOT NULL,
	"rationale" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gate_tolerances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"gate_code" text NOT NULL,
	"minimum_score" numeric(5, 2),
	"decline_threshold" numeric(5, 2),
	"required_approvals" integer DEFAULT 2,
	"approver_roles" text[],
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "gate_approvals" ADD CONSTRAINT "gate_approvals_evaluation_id_gate_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_approvals" ADD CONSTRAINT "gate_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_tolerances" ADD CONSTRAINT "gate_tolerances_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_tolerances" ADD CONSTRAINT "gate_tolerances_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_gate_tol_idx" ON "gate_tolerances" USING btree ("org_id","gate_code");