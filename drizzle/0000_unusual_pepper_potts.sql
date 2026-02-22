CREATE TABLE "module_consultations_consultations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pet_id" text NOT NULL,
	"vet_name" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"weight_kg" numeric,
	"temperature" numeric,
	"reason" text NOT NULL,
	"reason_category" text,
	"anamnesis" text,
	"physical_exam" text,
	"diagnosis" text,
	"diagnosis_tags" jsonb,
	"treatment" text,
	"follow_up_date" text,
	"follow_up_notes" text,
	"attachments" jsonb,
	"metadata" jsonb,
	"notes" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_consultations_consultation_medications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"name" text NOT NULL,
	"dosage" text,
	"frequency" text,
	"duration" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
