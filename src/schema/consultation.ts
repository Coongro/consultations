import { sql } from 'drizzle-orm';
import {
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const consultationTable = pgTable('module_consultations_consultations', {
  id: uuid('id').primaryKey().notNull(),
  pet_id: text('pet_id').notNull(),
  vet_name: text('vet_name').notNull(),
  staff_id: text('staff_id'),
  date: timestamp('date', { mode: 'date', withTimezone: true })
    .notNull()
    .default(sql`now()`),
  weight_kg: numeric('weight_kg'),
  temperature: numeric('temperature'),
  heart_rate: integer('heart_rate'),
  respiratory_rate: integer('respiratory_rate'),
  body_condition_score: numeric('body_condition_score'),
  reason: text('reason').notNull(),
  reason_category: text('reason_category'),
  anamnesis: text('anamnesis'),
  physical_exam: text('physical_exam'),
  physical_exam_systems: jsonb('physical_exam_systems'),
  diagnosis: text('diagnosis'),
  diagnosis_tags: jsonb('diagnosis_tags'),
  treatment: text('treatment'),
  follow_up_date: date('follow_up_date'),
  follow_up_start_time: time('follow_up_start_time'),
  follow_up_end_time: time('follow_up_end_time'),
  follow_up_notes: text('follow_up_notes'),
  attachments: jsonb('attachments'),
  metadata: jsonb('metadata'),
  notes: text('notes'),
  deleted_at: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
  created_at: timestamp('created_at', { mode: 'date', withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type ConsultationRow = typeof consultationTable.$inferSelect;
export type NewConsultationRow = typeof consultationTable.$inferInsert;
