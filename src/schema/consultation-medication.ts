import { sql } from 'drizzle-orm';
import { integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const consultationMedicationTable = pgTable(
  'module_consultations_consultation_medications',
  {
    id: uuid('id').primaryKey().notNull(),
    consultation_id: text('consultation_id').notNull(),
    name: text('name').notNull(),
    dosage_amount: numeric('dosage_amount'),
    dosage_unit: text('dosage_unit'),
    route: text('route'),
    frequency_hours: integer('frequency_hours'),
    duration_amount: integer('duration_amount'),
    duration_unit: text('duration_unit'),
    notes: text('notes'),
    created_at: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
  }
);

export type ConsultationMedicationRow = typeof consultationMedicationTable.$inferSelect;
export type NewConsultationMedicationRow = typeof consultationMedicationTable.$inferInsert;
