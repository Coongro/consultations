-- Reemplazar campos de texto libre por columnas estructuradas en medicamentos
-- dosage → dosage_amount (numeric) + dosage_unit (text)
-- frequency → frequency_hours (integer)
-- duration → duration_amount (integer) + duration_unit (text)
-- Nuevo: route (via de administracion)

ALTER TABLE "module_consultations_consultation_medications"
  ADD COLUMN IF NOT EXISTS "dosage_amount" numeric,
  ADD COLUMN IF NOT EXISTS "dosage_unit" text,
  ADD COLUMN IF NOT EXISTS "route" text,
  ADD COLUMN IF NOT EXISTS "frequency_hours" integer,
  ADD COLUMN IF NOT EXISTS "duration_amount" integer,
  ADD COLUMN IF NOT EXISTS "duration_unit" text;
--> statement-breakpoint

ALTER TABLE "module_consultations_consultation_medications"
  DROP COLUMN IF EXISTS "dosage",
  DROP COLUMN IF EXISTS "frequency",
  DROP COLUMN IF EXISTS "duration";
