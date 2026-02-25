/**
 * @coongro/consultations — Entry point principal (browser-safe)
 *
 * Exportar aquí: hooks, componentes, tipos, utilidades.
 * NO exportar schema tables ni repositories (usan drizzle-orm, solo backend).
 * Para exports server-only → usar server.ts
 */

// Componentes
export { ConsultationCard } from './components/ConsultationCard.js';
export { CreateConsultationButton } from './components/CreateConsultationButton.js';
export { ConsultationTimeline } from './components/ConsultationTimeline.js';
export { ConsultationDetail } from './components/ConsultationDetail.js';
export { ConsultationForm } from './components/ConsultationForm.js';
export { MedicationList } from './components/MedicationList.js';
export { MedicationFormList } from './components/MedicationFormList.js';

// Hooks
export { useConsultation } from './hooks/useConsultation.js';
export { useConsultations } from './hooks/useConsultations.js';
export { useConsultationsByPet } from './hooks/useConsultationsByPet.js';
export { useConsultationMutations } from './hooks/useConsultationMutations.js';
export { useConsultationsSettings } from './hooks/useConsultationsSettings.js';

// Types
export type {
  Consultation,
  ConsultationMedication,
  ConsultationCreateData,
  ConsultationUpdateData,
  MedicationInput,
  ConsultationWithMedications,
  ReasonCategory,
} from './types/consultation.js';
export type { ConsultationFilters, SortDirection } from './types/filters.js';
export type {
  ConsultationTimelineProps,
  ConsultationCardProps,
  ConsultationFormProps,
  ConsultationDetailProps,
  MedicationListProps,
  MedicationFormListProps,
  CreateConsultationButtonProps,
} from './types/components.js';

// Utils
export {
  REASON_CATEGORY_LABELS,
  REASON_CATEGORY_EMOJI,
  REASON_CATEGORY_BADGE_VARIANTS,
  ALL_REASON_CATEGORIES,
  formatReasonCategory,
  getReasonCategoryBadgeVariant,
  getReasonCategoryEmoji,
  formatConsultationDate,
  formatConsultationDateTime,
} from './utils/labels.js';
