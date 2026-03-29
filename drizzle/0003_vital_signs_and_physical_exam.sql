-- Agregar signos vitales completos (FC, FR, BCS) y examen fisico estructurado
-- heart_rate: frecuencia cardiaca (latidos por minuto)
-- respiratory_rate: frecuencia respiratoria (respiraciones por minuto)
-- body_condition_score: escala 1-9 (BCS)
-- physical_exam_systems: examen fisico por sistemas como JSONB

ALTER TABLE "module_consultations_consultations"
  ADD COLUMN IF NOT EXISTS "heart_rate" integer,
  ADD COLUMN IF NOT EXISTS "respiratory_rate" integer,
  ADD COLUMN IF NOT EXISTS "body_condition_score" numeric,
  ADD COLUMN IF NOT EXISTS "physical_exam_systems" jsonb;
