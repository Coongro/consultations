/**
 * Sincroniza consultas con eventos del calendario y turnos de seguimiento.
 * Si @coongro/appointments esta disponible, crea un turno real.
 * Si no, crea un evento de calendario como fallback.
 */
import type { EventCreateData, CalendarEvent } from '@coongro/calendar';
import { actions } from '@coongro/plugin-sdk';

import type { Consultation } from '../types/consultation.js';
import { parseFollowUpDate } from '../utils/follow-up.js';

const ENTITY_TYPE = 'consultation';
const DEFAULT_DURATION_MIN = 30;

function buildFollowUpEvent(consultation: Consultation, petName: string): EventCreateData {
  const { date, startTime, endTime } = parseFollowUpDate(consultation.follow_up_date);

  const startIso = `${date}T${startTime}:00.000Z`;
  // Si endTime difiere de startTime, usar esa hora; si no, calcular +30min
  const hasExplicitEnd = endTime !== startTime;
  let endIso: string;
  if (hasExplicitEnd) {
    endIso = `${date}T${endTime}:00.000Z`;
  } else {
    const endMs = new Date(startIso).getTime() + DEFAULT_DURATION_MIN * 60 * 1000;
    endIso = new Date(endMs).toISOString();
  }

  return {
    title: `Seguimiento: ${petName}`,
    description: consultation.reason,
    start_at: startIso,
    end_at: endIso,
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

interface PetWithOwner {
  name: string;
  owner_id: string;
}

/**
 * Intenta crear un appointment de seguimiento.
 * Primero crea el calendar event, luego el appointment vinculado.
 * Retorna true si se creo exitosamente.
 */
async function tryCreateFollowUpAppointment(
  consultation: Consultation,
  petName: string,
  calendarEvent: CalendarEvent
): Promise<boolean> {
  try {
    // Resolver owner_id del pet para el contact_id del appointment
    const pet = await actions.execute<PetWithOwner | undefined>('patients.pets.getById', {
      id: consultation.pet_id,
    });
    if (!pet?.owner_id) return false;

    await actions.execute('appointments.create', {
      data: {
        contact_id: pet.owner_id,
        pet_id: consultation.pet_id,
        staff_id: consultation.staff_id ?? null,
        reason: `Seguimiento: ${consultation.reason}`,
        notes: consultation.follow_up_notes ?? null,
        calendar_event_id: calendarEvent.id,
        consultation_id: consultation.id,
      },
    });
    return true;
  } catch {
    // appointments plugin no disponible o error — no es critico
    return false;
  }
}

/**
 * Crea o actualiza un evento de seguimiento en el calendario.
 * Si appointments esta disponible, tambien crea un turno.
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

  // Crear nuevo evento de calendario
  const result = await actions.execute<CalendarEvent[]>('calendar.events.create', {
    data: eventData,
  });
  const calendarEvent = result?.[0];
  if (!calendarEvent) return null;

  // Intentar crear appointment vinculado (fallback silencioso si no hay plugin)
  await tryCreateFollowUpAppointment(consultation, petName, calendarEvent);

  return calendarEvent;
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
