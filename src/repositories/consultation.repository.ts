import { asDateKey, dbNow, toDateKey, toUTCTimestamp } from '@coongro/datetime';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import type { SQL } from 'drizzle-orm';
import { eq, and, or, ilike, isNull, sql, asc, desc, gte, lte, count } from 'drizzle-orm';

import { consultationTable } from '../schema/consultation.js';
import type { ConsultationRow, NewConsultationRow } from '../schema/consultation.js';
import type { Consultation, PhysicalExamSystem } from '../types/consultation.js';

/** Mapper boundary: row de DB (strings sin brand) → entidad de dominio (UTCTimestamp). */
function toConsultation(row: ConsultationRow): Consultation {
  return {
    ...row,
    physical_exam_systems: row.physical_exam_systems as PhysicalExamSystem[] | null,
    diagnosis_tags: row.diagnosis_tags as string[] | null,
    metadata: row.metadata as Record<string, unknown> | null,
    date: toUTCTimestamp(row.date),
    follow_up_date: row.follow_up_date ? asDateKey(row.follow_up_date) : null,
    deleted_at: row.deleted_at ? toUTCTimestamp(row.deleted_at) : null,
    created_at: toUTCTimestamp(row.created_at),
    updated_at: toUTCTimestamp(row.updated_at),
  };
}

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

  async list(): Promise<Consultation[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationTable)
        .where(isNull(consultationTable.deleted_at))
        .orderBy(desc(consultationTable.date))
    );
    return rows.map(toConsultation);
  }

  async getById({ id }: { id: string }): Promise<Consultation | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(consultationTable).where(eq(consultationTable.id, id)).limit(1)
    );
    return rows[0] ? toConsultation(rows[0]) : undefined;
  }

  async create({ data }: { data: NewConsultationRow }): Promise<Consultation[]> {
    const dataAny = data as Record<string, unknown>;
    if (typeof dataAny.date === 'string') dataAny.date = new Date(dataAny.date);
    const row = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
    };
    const rows = await this.db.ormQuery((tx) =>
      tx.insert(consultationTable).values(row).returning()
    );
    return rows.map(toConsultation);
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewConsultationRow>;
  }): Promise<Consultation[]> {
    const dataAny = data as Record<string, unknown>;
    if (typeof dataAny.date === 'string') dataAny.date = new Date(dataAny.date);
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(consultationTable)
        .set({ ...data, updated_at: dbNow() } as Partial<NewConsultationRow>)
        .where(eq(consultationTable.id, id))
        .returning()
    );
    return rows.map(toConsultation);
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(consultationTable).where(eq(consultationTable.id, id))
    );
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  async softDelete({ id }: { id: string }): Promise<Consultation[]> {
    const now = dbNow();
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(consultationTable)
        .set({ deleted_at: now, updated_at: now } as Partial<ConsultationRow>)
        .where(eq(consultationTable.id, id))
        .returning()
    );
    return rows.map(toConsultation);
  }

  async restore({ id }: { id: string }): Promise<Consultation[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .update(consultationTable)
        .set({ deleted_at: null, updated_at: dbNow() } as Partial<ConsultationRow>)
        .where(eq(consultationTable.id, id))
        .returning()
    );
    return rows.map(toConsultation);
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
  }: ConsultationSearchParams): Promise<Consultation[]> {
    const rows = await this.db.ormQuery((tx) => {
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
        conditions.push(gte(consultationTable.date, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(consultationTable.date, new Date(dateTo)));
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
    return rows.map(toConsultation);
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
  }): Promise<Consultation[]> {
    const rows = await this.db.ormQuery((tx) => {
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
    return rows.map(toConsultation);
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

  async getLatestByPet({ petId }: { petId: string }): Promise<Consultation | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(consultationTable)
        .where(and(eq(consultationTable.pet_id, petId), isNull(consultationTable.deleted_at)))
        .orderBy(desc(consultationTable.date))
        .limit(1)
    );
    return rows[0] ? toConsultation(rows[0]) : undefined;
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

  async countPendingFollowUps({ tz }: { tz: string }): Promise<number> {
    const today = toDateKey(new Date(), tz);
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ value: count() })
        .from(consultationTable)
        .where(
          and(isNull(consultationTable.deleted_at), gte(consultationTable.follow_up_date, today))
        )
    );
    return rows[0]?.value ?? 0;
  }
}
