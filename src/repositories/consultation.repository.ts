import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import type { SQL } from 'drizzle-orm';
import { eq, and, or, ilike, isNull, sql, asc, desc, gte, lte, count } from 'drizzle-orm';

import { consultationTable } from '../schema/consultation.js';
import type { ConsultationRow, NewConsultationRow } from '../schema/consultation.js';

export interface ConsultationSearchParams {
  petId?: string;
  vetName?: string;
  reasonCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface CountResult {
  label: string;
  count: number;
}

export class ConsultationRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async list(): Promise<ConsultationRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationTable)
        .where(isNull(consultationTable.deleted_at))
        .orderBy(desc(consultationTable.date))
    );
  }

  async getById({ id }: { id: string }): Promise<ConsultationRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(consultationTable).where(eq(consultationTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewConsultationRow }): Promise<ConsultationRow[]> {
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
    };
    return this.db.ormQuery((tx) => tx.insert(consultationTable).values(row).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewConsultationRow>;
  }): Promise<ConsultationRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(consultationTable)
        .set({ ...data, updated_at: new Date().toISOString() } as Partial<NewConsultationRow>)
        .where(eq(consultationTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(consultationTable).where(eq(consultationTable.id, id))
    );
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  async softDelete({ id }: { id: string }): Promise<ConsultationRow[]> {
    const now = new Date().toISOString();
    return this.db.ormQuery((tx) =>
      tx
        .update(consultationTable)
        .set({ deleted_at: now, updated_at: now } as Partial<ConsultationRow>)
        .where(eq(consultationTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<ConsultationRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(consultationTable)
        .set({ deleted_at: null, updated_at: new Date().toISOString() } as Partial<ConsultationRow>)
        .where(eq(consultationTable.id, id))
        .returning()
    );
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async search({
    petId,
    vetName,
    reasonCategory,
    dateFrom,
    dateTo,
    query,
    includeDeleted,
    limit: searchLimit,
    offset: searchOffset,
    orderBy: orderByField,
    orderDir = 'desc',
  }: ConsultationSearchParams): Promise<ConsultationRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions: SQL[] = [];

      if (!includeDeleted) {
        conditions.push(isNull(consultationTable.deleted_at));
      }

      if (petId) {
        conditions.push(eq(consultationTable.pet_id, petId));
      }

      if (vetName) {
        conditions.push(ilike(consultationTable.vet_name, `%${vetName}%`));
      }

      if (reasonCategory) {
        conditions.push(eq(consultationTable.reason_category, reasonCategory));
      }

      if (dateFrom) {
        conditions.push(gte(consultationTable.date, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(consultationTable.date, dateTo));
      }

      if (query) {
        const pattern = `%${query}%`;
        conditions.push(
          or(
            ilike(consultationTable.reason, pattern),
            ilike(consultationTable.diagnosis, pattern),
            ilike(consultationTable.treatment, pattern),
            ilike(consultationTable.notes, pattern),
            ilike(consultationTable.vet_name, pattern)
          )
        );
      }

      let q = tx.select().from(consultationTable);

      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as typeof q;
      }

      const sortableColumns: Record<string, () => typeof q> = {
        date: () =>
          q.orderBy((orderDir === 'asc' ? asc : desc)(consultationTable.date)) as typeof q,
        vet_name: () =>
          q.orderBy((orderDir === 'asc' ? asc : desc)(consultationTable.vet_name)) as typeof q,
        reason_category: () =>
          q.orderBy(
            (orderDir === 'asc' ? asc : desc)(consultationTable.reason_category)
          ) as typeof q,
        created_at: () =>
          q.orderBy((orderDir === 'asc' ? asc : desc)(consultationTable.created_at)) as typeof q,
      };

      const applySorting = orderByField ? sortableColumns[orderByField] : undefined;
      if (applySorting) {
        q = applySorting();
      } else {
        q = q.orderBy(desc(consultationTable.date)) as typeof q;
      }

      if (searchLimit) {
        q = q.limit(searchLimit) as typeof q;
      }

      if (searchOffset) {
        q = q.offset(searchOffset) as typeof q;
      }

      return q;
    });
  }

  // ---------------------------------------------------------------------------
  // Por mascota
  // ---------------------------------------------------------------------------

  async listByPet({
    petId,
    limit: queryLimit,
    offset: queryOffset,
  }: {
    petId: string;
    limit?: number;
    offset?: number;
  }): Promise<ConsultationRow[]> {
    return this.db.ormQuery((tx) => {
      let q = tx
        .select()
        .from(consultationTable)
        .where(and(eq(consultationTable.pet_id, petId), isNull(consultationTable.deleted_at)))
        .orderBy(desc(consultationTable.date));

      if (queryLimit) {
        q = q.limit(queryLimit) as typeof q;
      }
      if (queryOffset) {
        q = q.offset(queryOffset) as typeof q;
      }

      return q;
    });
  }

  async countByPet({ petId }: { petId: string }): Promise<number> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ value: count() })
        .from(consultationTable)
        .where(and(eq(consultationTable.pet_id, petId), isNull(consultationTable.deleted_at)))
    );
    return rows[0]?.value ?? 0;
  }

  async getLatestByPet({ petId }: { petId: string }): Promise<ConsultationRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationTable)
        .where(and(eq(consultationTable.pet_id, petId), isNull(consultationTable.deleted_at)))
        .orderBy(desc(consultationTable.date))
        .limit(1)
    );
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async countByReasonCategory(): Promise<CountResult[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(sql`
        SELECT reason_category AS label, COUNT(*)::int AS count
        FROM ${consultationTable}
        WHERE deleted_at IS NULL AND reason_category IS NOT NULL
        GROUP BY reason_category
        ORDER BY count DESC
      `)
    );
    return rows as unknown as CountResult[];
  }

  async countTotal(): Promise<number> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ value: count() })
        .from(consultationTable)
        .where(isNull(consultationTable.deleted_at))
    );
    return rows[0]?.value ?? 0;
  }

  async countPendingFollowUps(): Promise<number> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ value: count() })
        .from(consultationTable)
        .where(
          and(
            isNull(consultationTable.deleted_at),
            gte(consultationTable.follow_up_date, new Date().toISOString().slice(0, 10))
          )
        )
    );
    return rows[0]?.value ?? 0;
  }
}
