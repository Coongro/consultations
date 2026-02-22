/**
 * @coongro/consultations — Entry point para lógica de activación.
 *
 * Auto-seed: crea categorías y servicios veterinarios por defecto
 * en @coongro/products la primera vez que se activa el plugin.
 */
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { categoryTable, productTable } from '@coongro/products/server';
import { eq } from 'drizzle-orm';

import { ROOT_SERVICE_CATEGORY_SLUG as ROOT_CATEGORY_SLUG } from './constants/services.js';

interface ActivationAPI {
  logger: {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
  };
  registerCommand: (id: string, handler: (...args: unknown[]) => unknown) => void;
  database: ModuleDatabaseAPI;
}

// -----------------------------------------------------------------------
// Datos de seed
// -----------------------------------------------------------------------

interface ServiceSeed {
  name: string;
  description?: string;
}

interface CategorySeed {
  name: string;
  slug: string;
  order: number;
  services: ServiceSeed[];
}

const SERVICE_CATEGORIES: CategorySeed[] = [
  {
    name: 'Consultas',
    slug: '_vet-svc-consultas',
    order: 1,
    services: [
      { name: 'Consulta general', description: 'Consulta clínica de rutina' },
      { name: 'Consulta a domicilio', description: 'Visita veterinaria al domicilio del cliente' },
      { name: 'Consulta de urgencia', description: 'Atención de emergencia fuera de horario' },
    ],
  },
  {
    name: 'Cirugías',
    slug: '_vet-svc-cirugias',
    order: 2,
    services: [
      { name: 'Castración macho', description: 'Orquiectomía' },
      { name: 'Castración hembra', description: 'Ovariohisterectomía' },
      { name: 'Cesárea', description: 'Intervención quirúrgica obstétrica' },
    ],
  },
  {
    name: 'Vacunación',
    slug: '_vet-svc-vacunacion',
    order: 3,
    services: [
      { name: 'Antirrábica', description: 'Vacuna contra la rabia' },
      { name: 'Séxtuple canina', description: 'Moquillo, parvovirus, hepatitis, parainfluenza, leptospira' },
      { name: 'Triple felina', description: 'Rinotraqueitis, calicivirus, panleucopenia' },
    ],
  },
  {
    name: 'Diagnóstico',
    slug: '_vet-svc-diagnostico',
    order: 4,
    services: [
      { name: 'Ecografía', description: 'Estudio ecográfico' },
      { name: 'Radiografía', description: 'Estudio radiológico' },
      { name: 'Electrocardiograma', description: 'Estudio cardíaco ECG' },
    ],
  },
  {
    name: 'Otros servicios',
    slug: '_vet-svc-otros',
    order: 5,
    services: [
      { name: 'Limpieza dental', description: 'Profilaxis dental con ultrasonido' },
      { name: 'Internación (por día)', description: 'Estadía en internación con monitoreo' },
      { name: 'Eutanasia', description: 'Eutanasia humanitaria' },
    ],
  },
];

// -----------------------------------------------------------------------
// Seed
// -----------------------------------------------------------------------

async function seedServices(db: ModuleDatabaseAPI, logger: ActivationAPI['logger']): Promise<void> {
  // Verificar si ya existe la categoría raíz (idempotencia por slug)
  const existing = await db.ormQuery((tx) =>
    tx
      .select({ id: categoryTable.id })
      .from(categoryTable)
      .where(eq(categoryTable.slug, ROOT_CATEGORY_SLUG))
      .limit(1)
  );

  if (existing.length > 0) {
    logger.debug('Service categories already seeded, skipping');
    return;
  }

  logger.log('Seeding default veterinary service categories and services...');

  // Crear categoría raíz
  // Los type assertions son necesarios porque los genéricos de Drizzle
  // no se resuelven correctamente en imports cross-plugin via tsconfig paths.
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
  const rootId = crypto.randomUUID();
  await db.ormQuery((tx) =>
    tx.insert(categoryTable).values({
      id: rootId,
      name: 'Servicios Veterinarios',
      slug: ROOT_CATEGORY_SLUG,
      description: 'Servicios profesionales veterinarios',
      order: 0,
      metadata: { _seeded: true },
    } as any)
  );

  // Crear subcategorías y servicios
  for (const cat of SERVICE_CATEGORIES) {
    const catId = crypto.randomUUID();
    await db.ormQuery((tx) =>
      tx.insert(categoryTable).values({
        id: catId,
        name: cat.name,
        slug: cat.slug,
        parent_id: rootId,
        order: cat.order,
        metadata: { _seeded: true },
      } as any)
    );

    for (const svc of cat.services) {
      await db.ormQuery((tx) =>
        tx.insert(productTable).values({
          id: crypto.randomUUID(),
          name: svc.name,
          description: svc.description ?? null,
          category_id: catId,
          sale_price: '0',
          metadata: { _seeded: true, type: 'service' },
        } as any)
      );
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

  logger.log(
    `Seeded ${SERVICE_CATEGORIES.length} categories with ${SERVICE_CATEGORIES.reduce((acc, c) => acc + c.services.length, 0)} services`
  );
}

// -----------------------------------------------------------------------
// Activate
// -----------------------------------------------------------------------

export async function activate(context: { api: ActivationAPI }): Promise<void> {
  const { api } = context;

  try {
    await seedServices(api.database, api.logger);
  } catch (err) {
    api.logger.error('Failed to seed veterinary services:', err);
  }
}
