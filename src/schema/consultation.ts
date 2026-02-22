import { sql } from 'drizzle-orm';
import { jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const consultationTable = pgTable('module_consultations_consultations', {
  id: uuid('id').primaryKey().notNull(),
  pet_id: text('pet_id').notNull(),
  vet_name: text('vet_name').notNull(),
  date: timestamp('date', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  weight_kg: numeric('weight_kg'),
  temperature: numeric('temperature'),
  reason: text('reason').notNull(),
  reason_category: text('reason_category'),
  anamnesis: text('anamnesis'),
  physical_exam: text('physical_exam'),
  diagnosis: text('diagnosis'),
  diagnosis_tags: jsonb('diagnosis_tags'),
  treatment: text('treatment'),
  follow_up_date: text('follow_up_date'),
  follow_up_notes: text('follow_up_notes'),
  attachments: jsonb('attachments'),
  metadata: jsonb('metadata'),
  notes: text('notes'),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type ConsultationRow = typeof consultationTable.$inferSelect;
export type NewConsultationRow = typeof consultationTable.$inferInsert;
