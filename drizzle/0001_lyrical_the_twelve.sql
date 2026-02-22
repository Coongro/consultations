CREATE TABLE "module_consultations_services" (
	"id" uuid PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"unit_price" numeric NOT NULL,
	"subtotal" numeric NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
