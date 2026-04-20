-- Migrar todos los timestamps a `with time zone` para que Drizzle devuelva ISO con offset.
-- Reemplazar `follow_up_date` (text custom "YYYY-MM-DD HH:mm-HH:mm") por 3 columnas tipadas:
--   follow_up_date (date), follow_up_start_time (time), follow_up_end_time (time).
-- Sin migracion de datos: pre-launch, no hay datos productivos.

ALTER TABLE "module_consultations_consultations"
  ALTER COLUMN "date" TYPE timestamp with time zone USING "date" AT TIME ZONE 'UTC',
  ALTER COLUMN "deleted_at" TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint

ALTER TABLE "module_consultations_consultations"
  DROP COLUMN IF EXISTS "follow_up_date";
--> statement-breakpoint

ALTER TABLE "module_consultations_consultations"
  ADD COLUMN "follow_up_date" date,
  ADD COLUMN "follow_up_start_time" time,
  ADD COLUMN "follow_up_end_time" time;
--> statement-breakpoint

ALTER TABLE "module_consultations_consultation_medications"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
--> statement-breakpoint

ALTER TABLE "module_consultations_services"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
