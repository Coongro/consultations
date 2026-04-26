/**
 * Tipos de consulta para uso en componentes y hooks.
 */
import type { DateKey, UTCTimestamp } from '@coongro/datetime';

export type ReasonCategory = 'routine' | 'vaccination' | 'illness' | 'surgery' | 'emergency';

export interface PhysicalExamSystem {
  system: string;
  status: 'WNL' | 'ABN';
  notes: string;
}

export const EXAM_SYSTEMS = [
  'Apariencia general',
  'Ojos',
  'Oídos',
  'Cavidad oral',
  'Ganglios linfáticos',
  'Cardiovascular',
  'Respiratorio',
  'Abdominal',
  'Musculoesquelético',
  'Neurológico',
  'Piel / Tegumento',
  'Urogenital',
] as const;

/** Ejemplos contextuales de hallazgos por sistema, usados como placeholder en ExamSystemRow */
export const EXAM_SYSTEM_EXAMPLES: Record<string, string> = {
  'Apariencia general': 'Ej: Alerta, buen estado corporal',
  Ojos: 'Ej: Secreción ocular, conjuntivitis',
  Oídos: 'Ej: Otitis, cerumen excesivo',
  'Cavidad oral': 'Ej: Sarro grado II, gingivitis',
  'Ganglios linfáticos': 'Ej: Submandibulares reactivos',
  Cardiovascular: 'Ej: Soplo grado III/VI, arritmia',
  Respiratorio: 'Ej: Crepitaciones, disnea leve',
  Abdominal: 'Ej: Dolor a la palpación, distensión',
  Musculoesquelético: 'Ej: Claudicación MPD, dolor lumbar',
  Neurológico: 'Ej: Ataxia, déficit propioceptivo',
  'Piel / Tegumento': 'Ej: Alopecia focal, dermatitis',
  Urogenital: 'Ej: Criptorquidia, secreción vulvar',
};

export interface Consultation {
  id: string;
  pet_id: string;
  vet_name: string;
  staff_id: string | null;
  date: UTCTimestamp;
  weight_kg: string | null;
  temperature: string | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  body_condition_score: string | null;
  reason: string;
  reason_category: string | null;
  anamnesis: string | null;
  physical_exam: string | null;
  physical_exam_systems: PhysicalExamSystem[] | null;
  diagnosis: string | null;
  diagnosis_tags: string[] | null;
  treatment: string | null;
  follow_up_date: DateKey | null;
  follow_up_start_time: string | null;
  follow_up_end_time: string | null;
  follow_up_notes: string | null;
  attachments: unknown;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  deleted_at: UTCTimestamp | null;
  created_at: UTCTimestamp;
  updated_at: UTCTimestamp;
}

export interface ConsultationMedication {
  id: string;
  consultation_id: string;
  name: string;
  dosage_amount: string | null;
  dosage_unit: string | null;
  route: string | null;
  frequency_hours: number | null;
  duration_amount: number | null;
  duration_unit: string | null;
  notes: string | null;
  created_at: UTCTimestamp;
}

export interface ConsultationCreateData {
  pet_id: string;
  vet_name: string;
  staff_id?: string | null;
  date?: UTCTimestamp;
  weight_kg?: string | null;
  temperature?: string | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  body_condition_score?: string | null;
  reason: string;
  reason_category?: string | null;
  anamnesis?: string | null;
  physical_exam?: string | null;
  physical_exam_systems?: PhysicalExamSystem[] | null;
  diagnosis?: string | null;
  diagnosis_tags?: string[] | null;
  treatment?: string | null;
  follow_up_date?: DateKey | null;
  follow_up_start_time?: string | null;
  follow_up_end_time?: string | null;
  follow_up_notes?: string | null;
  notes?: string | null;
  medications?: MedicationInput[];
  services?: ServiceLineInput[];
}

export interface ConsultationUpdateData {
  vet_name?: string;
  staff_id?: string | null;
  date?: UTCTimestamp;
  weight_kg?: string | null;
  temperature?: string | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  body_condition_score?: string | null;
  reason?: string;
  reason_category?: string | null;
  anamnesis?: string | null;
  physical_exam?: string | null;
  physical_exam_systems?: PhysicalExamSystem[] | null;
  diagnosis?: string | null;
  diagnosis_tags?: string[] | null;
  treatment?: string | null;
  follow_up_date?: DateKey | null;
  follow_up_start_time?: string | null;
  follow_up_end_time?: string | null;
  follow_up_notes?: string | null;
  notes?: string | null;
  medications?: MedicationInput[];
  services?: ServiceLineInput[];
}

export interface MedicationInput {
  name: string;
  dosage_amount?: string | null;
  dosage_unit?: string | null;
  route?: string | null;
  frequency_hours?: number | null;
  duration_amount?: number | null;
  duration_unit?: string | null;
  notes?: string | null;
}

export interface ServiceLineInput {
  product_id?: string | null;
  product_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  notes?: string | null;
}

export interface ConsultationService {
  id: string;
  consultation_id: string;
  product_id: string | null;
  product_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  notes: string | null;
  created_at: string;
}

/** Consulta con medicamentos cargados */
export interface ConsultationWithMedications extends Consultation {
  medications: ConsultationMedication[];
}
