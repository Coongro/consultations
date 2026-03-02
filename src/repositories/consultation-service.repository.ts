import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, sql } from 'drizzle-orm';

import { consultationServiceTable } from '../schema/consultation-service.js';
import type {
  ConsultationServiceRow,
  NewConsultationServiceRow,
} from '../schema/consultation-service.js';

export class ConsultationServiceRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async list(): Promise<ConsultationServiceRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(consultationServiceTable));
  }

  async getById({ id }: { id: string }): Promise<ConsultationServiceRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(consultationServiceTable).where(eq(consultationServiceTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewConsultationServiceRow }): Promise<ConsultationServiceRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
    };
    return this.db.ormQuery((tx) => tx.insert(consultationServiceTable).values(row).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewConsultationServiceRow>;
  }): Promise<ConsultationServiceRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(consultationServiceTable)
        .set(data)
        .where(eq(consultationServiceTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(consultationServiceTable).where(eq(consultationServiceTable.id, id))
    );
  }

  // ---------------------------------------------------------------------------
  // Por consulta
  // ---------------------------------------------------------------------------

  async listByConsultation({
    consultationId,
  }: {
    consultationId: string;
  }): Promise<ConsultationServiceRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationServiceTable)
        .where(eq(consultationServiceTable.consultation_id, consultationId))
    );
  }

  async deleteByConsultation({ consultationId }: { consultationId: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx
        .delete(consultationServiceTable)
        .where(eq(consultationServiceTable.consultation_id, consultationId))
    );
  }

  // ---------------------------------------------------------------------------
  // Totales
  // ---------------------------------------------------------------------------

  async totalByConsultation({ consultationId }: { consultationId: string }): Promise<number> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ total: sql<string>`COALESCE(SUM(subtotal::numeric), 0)::text` })
        .from(consultationServiceTable)
        .where(eq(consultationServiceTable.consultation_id, consultationId))
    );
    return parseFloat(rows[0]?.total ?? '0');
  }

  async totalsByConsultations({
    consultationIds,
  }: {
    consultationIds: string[];
  }): Promise<Record<string, number>> {
    if (consultationIds.length === 0) return {};
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({
          consultation_id: consultationServiceTable.consultation_id,
          total: sql<string>`SUM(subtotal::numeric)::text`,
        })
        .from(consultationServiceTable)
        .where(sql`${consultationServiceTable.consultation_id} = ANY(${consultationIds})`)
        .groupBy(consultationServiceTable.consultation_id)
    );
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.consultation_id] = parseFloat(row.total ?? '0');
    }
    return map;
  }
}
