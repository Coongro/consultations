/**
 * Tipos de consulta para uso en componentes y hooks.
 */

export type ReasonCategory = 'routine' | 'vaccination' | 'illness' | 'surgery' | 'emergency';

export interface Consultation {
  id: string;
  pet_id: string;
  vet_name: string;
  date: string;
  weight_kg: string | null;
  temperature: string | null;
  reason: string;
  reason_category: string | null;
  anamnesis: string | null;
  physical_exam: string | null;
  diagnosis: string | null;
  diagnosis_tags: string[] | null;
  treatment: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  attachments: unknown;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationMedication {
  id: string;
  consultation_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  notes: string | null;
  created_at: string;
}

export interface ConsultationCreateData {
  pet_id: string;
  vet_name: string;
  date?: string;
  weight_kg?: string | null;
  temperature?: string | null;
  reason: string;
  reason_category?: string | null;
  anamnesis?: string | null;
  physical_exam?: string | null;
  diagnosis?: string | null;
  diagnosis_tags?: string[] | null;
  treatment?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  notes?: string | null;
  medications?: MedicationInput[];
  services?: ServiceLineInput[];
}

export interface ConsultationUpdateData {
  vet_name?: string;
  date?: string;
  weight_kg?: string | null;
  temperature?: string | null;
  reason?: string;
  reason_category?: string | null;
  anamnesis?: string | null;
  physical_exam?: string | null;
  diagnosis?: string | null;
  diagnosis_tags?: string[] | null;
  treatment?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  notes?: string | null;
  services?: ServiceLineInput[];
}

export interface MedicationInput {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
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
