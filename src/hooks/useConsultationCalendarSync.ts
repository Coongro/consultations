/**
 * Sincroniza consultas con eventos del calendario.
 * Crea/actualiza eventos en @coongro/calendar cuando una consulta
 * tiene follow_up_date definido.
 */
import type { EventCreateData, CalendarEvent } from '@coongro/calendar';
import { actions } from '@coongro/plugin-sdk';

import type { Consultation } from '../types/consultation.js';

const ENTITY_TYPE = 'consultation';
const DEFAULT_DURATION_MIN = 30;
const DEFAULT_TIME = '09:00';

function buildFollowUpEvent(consultation: Consultation, petName: string): EventCreateData {
  const dateStr = consultation.follow_up_date;
  const startAt = new Date(`${dateStr}T${DEFAULT_TIME}:00`);
  const endAt = new Date(startAt.getTime() + DEFAULT_DURATION_MIN * 60 * 1000);

  return {
    title: `Seguimiento: ${petName}`,
    description: consultation.reason,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    status: 'scheduled',
    entity_id: consultation.id,
    entity_type: ENTITY_TYPE,
    notes: consultation.follow_up_notes ?? consultation.notes ?? undefined,
    metadata: {
      pet_id: consultation.pet_id,
      consultation_id: consultation.id,
      reason: consultation.reason,
    },
  };
}

/**
 * Crea o actualiza un evento de seguimiento en el calendario.
 * Si ya existe un evento vinculado a esta consulta, lo actualiza.
 */
export async function syncFollowUpEvent(
  consultation: Consultation,
  petName: string
): Promise<CalendarEvent | null> {
  if (!consultation.follow_up_date) return null;

  const existing = await actions.execute<CalendarEvent[]>('calendar.events.listByEntity', {
    entityId: consultation.id,
    entityType: ENTITY_TYPE,
  });

  const eventData = buildFollowUpEvent(consultation, petName);
  const existingEvent = existing?.[0];

  if (existingEvent) {
    const result = await actions.execute<CalendarEvent[]>('calendar.events.update', {
      id: existingEvent.id,
      data: eventData,
    });
    return result?.[0] ?? null;
  }

  const result = await actions.execute<CalendarEvent[]>('calendar.events.create', {
    data: eventData,
  });
  return result?.[0] ?? null;
}

/**
 * Elimina eventos de seguimiento vinculados a una consulta.
 */
export async function removeFollowUpEvent(consultationId: string): Promise<void> {
  const existing = await actions.execute<CalendarEvent[]>('calendar.events.listByEntity', {
    entityId: consultationId,
    entityType: ENTITY_TYPE,
  });

  if (existing?.length) {
    await Promise.all(
      existing.map((e) => actions.execute('calendar.events.softDelete', { id: e.id }))
    );
  }
}
