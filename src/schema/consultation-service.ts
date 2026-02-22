import { sql } from 'drizzle-orm';
import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const consultationServiceTable = pgTable('module_consultations_services', {
  id: uuid('id').primaryKey().notNull(),
  consultation_id: text('consultation_id').notNull(),
  product_id: uuid('product_id'),
  product_name: text('product_name').notNull(),
  quantity: numeric('quantity').notNull().default('1'),
  unit_price: numeric('unit_price').notNull(),
  subtotal: numeric('subtotal').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type ConsultationServiceRow = typeof consultationServiceTable.$inferSelect;
export type NewConsultationServiceRow = typeof consultationServiceTable.$inferInsert;
