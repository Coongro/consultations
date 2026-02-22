import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const consultationMedicationTable = pgTable(
  'module_consultations_consultation_medications',
  {
    id: uuid('id').primaryKey().notNull(),
    consultation_id: text('consultation_id').notNull(),
    name: text('name').notNull(),
    dosage: text('dosage'),
    frequency: text('frequency'),
    duration: text('duration'),
    notes: text('notes'),
    created_at: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
  }
);

export type ConsultationMedicationRow = typeof consultationMedicationTable.$inferSelect;
export type NewConsultationMedicationRow = typeof consultationMedicationTable.$inferInsert;
