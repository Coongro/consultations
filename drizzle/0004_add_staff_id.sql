ALTER TABLE "module_consultations_consultations"
  ADD COLUMN IF NOT EXISTS "staff_id" text DEFAULT NULL;
