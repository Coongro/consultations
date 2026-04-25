import { utcToLocal } from '@coongro/datetime';
import type { UTCTimestamp } from '@coongro/datetime';

import type { ReasonCategory } from '../types/consultation.js';

export const REASON_CATEGORY_LABELS: Record<ReasonCategory, string> = {
  routine: 'Control',
  vaccination: 'Vacunación',
  illness: 'Enfermedad',
  surgery: 'Cirugía',
  emergency: 'Emergencia',
};

/** Mapeo categoría → nombre de icono Lucide */
export const REASON_CATEGORY_ICON: Record<ReasonCategory, string> = {
  routine: 'CalendarCheck',
  vaccination: 'Syringe',
  illness: 'Thermometer',
  surgery: 'Scissors',
  emergency: 'Siren',
};

export const REASON_CATEGORY_BADGE_VARIANTS: Record<ReasonCategory, string> = {
  routine: 'info',
  vaccination: 'success-soft',
  illness: 'warning-soft',
  surgery: 'purple',
  emergency: 'danger-soft',
};

export const ALL_REASON_CATEGORIES: ReasonCategory[] = [
  'routine',
  'vaccination',
  'illness',
  'surgery',
  'emergency',
];

export function formatReasonCategory(category: string | null): string {
  if (!category) return '';
  return REASON_CATEGORY_LABELS[category as ReasonCategory] ?? category;
}

export function getReasonCategoryBadgeVariant(category: string | null): string {
  if (!category) return 'secondary';
  return REASON_CATEGORY_BADGE_VARIANTS[category as ReasonCategory] ?? 'secondary';
}

export function getReasonCategoryIcon(category: string | null): string {
  if (!category) return 'ClipboardList';
  return REASON_CATEGORY_ICON[category as ReasonCategory] ?? 'ClipboardList';
}

export function formatConsultationDate(value: UTCTimestamp, tz: string): string {
  return utcToLocal(value, tz).setLocale('es-AR').toFormat('dd/MM/yyyy');
}

export function formatConsultationDateTime(value: UTCTimestamp, tz: string): string {
  return utcToLocal(value, tz).setLocale('es-AR').toFormat('dd/MM/yyyy HH:mm');
}
