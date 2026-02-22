import type { ReasonCategory } from '../types/consultation.js';

export const REASON_CATEGORY_LABELS: Record<ReasonCategory, string> = {
  routine: 'Control',
  vaccination: 'Vacunación',
  illness: 'Enfermedad',
  surgery: 'Cirugía',
  emergency: 'Emergencia',
};

export const REASON_CATEGORY_EMOJI: Record<ReasonCategory, string> = {
  routine: '🔵',
  vaccination: '💉',
  illness: '🤒',
  surgery: '🔪',
  emergency: '🚨',
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

export function getReasonCategoryEmoji(category: string | null): string {
  if (!category) return '📋';
  return REASON_CATEGORY_EMOJI[category as ReasonCategory] ?? '📋';
}

export function formatConsultationDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatConsultationDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
