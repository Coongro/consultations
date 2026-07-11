import { utcToLocal } from '@coongro/datetime';
import type { UTCTimestamp } from '@coongro/datetime';

export function formatConsultationDate(value: UTCTimestamp, tz: string): string {
  return utcToLocal(value, tz).setLocale('es-AR').toFormat('dd/MM/yyyy');
}

export function formatConsultationDateTime(value: UTCTimestamp, tz: string): string {
  return utcToLocal(value, tz).setLocale('es-AR').toFormat('dd/MM/yyyy HH:mm');
}
