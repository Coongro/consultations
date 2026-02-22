import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq } from 'drizzle-orm';

import { consultationMedicationTable } from '../schema/consultation-medication.js';
import type {
  ConsultationMedicationRow,
  NewConsultationMedicationRow,
} from '../schema/consultation-medication.js';

export class ConsultationMedicationRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async list(): Promise<ConsultationMedicationRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(consultationMedicationTable));
  }

  async getById({ id }: { id: string }): Promise<ConsultationMedicationRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationMedicationTable)
        .where(eq(consultationMedicationTable.id, id))
        .limit(1)
    );
    return rows[0];
  }

  async create({
    data,
  }: {
    data: NewConsultationMedicationRow;
  }): Promise<ConsultationMedicationRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
    };
    return this.db.ormQuery((tx) => tx.insert(consultationMedicationTable).values(row).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewConsultationMedicationRow>;
  }): Promise<ConsultationMedicationRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(consultationMedicationTable)
        .set(data)
        .where(eq(consultationMedicationTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(consultationMedicationTable).where(eq(consultationMedicationTable.id, id))
    );
  }

  // ---------------------------------------------------------------------------
  // Por consulta
  // ---------------------------------------------------------------------------

  async listByConsultation({
    consultationId,
  }: {
    consultationId: string;
  }): Promise<ConsultationMedicationRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationMedicationTable)
        .where(eq(consultationMedicationTable.consultation_id, consultationId))
    );
  }

  async deleteByConsultation({ consultationId }: { consultationId: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx
        .delete(consultationMedicationTable)
        .where(eq(consultationMedicationTable.consultation_id, consultationId))
    );
  }
}
