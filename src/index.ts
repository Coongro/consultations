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
export { DefaultVetSetting } from './components/DefaultVetSetting.js';
export { MedicationList } from './components/MedicationList.js';
export { MedicationFormList } from './components/MedicationFormList.js';
export { ConsultationStats } from './components/ConsultationStats.js';
export { ServiceLineForm } from './components/ServiceLineForm.js';
export { VitalSignCard, type VitalSignCardProps } from './components/VitalSignCard.js';
export {
  PhysicalExamSummary,
  type PhysicalExamSummaryProps,
} from './components/PhysicalExamSummary.js';
export { PriceInput, type PriceInputProps } from './components/PriceInput.js';
export {
  ServiceFormDialog,
  type ServiceFormDialogProps,
  type ServiceFormValues,
} from './components/ServiceFormDialog.js';

// Hooks
export { useConsultation } from './hooks/useConsultation.js';
export { useConsultations } from './hooks/useConsultations.js';
export { useConsultationsByPet } from './hooks/useConsultationsByPet.js';
export { useConsultationMutations } from './hooks/useConsultationMutations.js';
export { useConsultationsSettings } from './hooks/useConsultationsSettings.js';

// Tipos
export type {
  Consultation,
  ConsultationMedication,
  ConsultationCreateData,
  ConsultationUpdateData,
  MedicationInput,
  ServiceLineInput,
  ConsultationService,
  ConsultationWithMedications,
  ReasonCategory,
  PhysicalExamSystem,
} from './types/consultation.js';
export { EXAM_SYSTEMS } from './types/consultation.js';
export type { ConsultationFilters, SortDirection } from './types/filters.js';
export type {
  PetInfo,
  ConsultationTimelineProps,
  ConsultationCardProps,
  ConsultationFormProps,
  ConsultationDetailProps,
  MedicationListProps,
  MedicationFormListProps,
  CreateConsultationButtonProps,
} from './types/components.js';
export type { ServiceLineFormProps } from './components/ServiceLineForm.js';

// Constantes de servicios
export { ROOT_SERVICE_CATEGORY_SLUG } from './constants/services.js';

// Constantes de medicacion (exportables cross-plugin)
export {
  DOSAGE_UNITS,
  ROUTES,
  FREQUENCY_HOURS,
  FREQUENCY_LABELS,
  DURATION_UNITS,
} from './constants/medication.js';
export type { DosageUnit, Route, FrequencyHours, DurationUnit } from './constants/medication.js';

// Utilidades
export { formatPrice, formatCurrency, sanitizePrice, isValidPrice } from './utils/price.js';
export { createCategoryMap } from './utils/categories.js';
export {
  REASON_CATEGORY_LABELS,
  REASON_CATEGORY_ICON,
  REASON_CATEGORY_BADGE_VARIANTS,
  ALL_REASON_CATEGORIES,
  formatReasonCategory,
  getReasonCategoryBadgeVariant,
  getReasonCategoryIcon,
  formatConsultationDate,
  formatConsultationDateTime,
} from './utils/labels.js';
