/**
 * Props para todos los componentes reutilizables de consultations.
 */
import type {
  Consultation,
  ConsultationCreateData,
  ConsultationMedication,
  MedicationInput,
} from './consultation.js';

// Tipos de extension (misma firma que @coongro/contacts)
export interface SectionDef {
  title: string;
  render: () => unknown;
  order?: number;
}

export interface ActionDef<T = unknown> {
  label: string;
  onClick: (item: T) => void;
}

export interface ColumnDef<T = unknown> {
  key: string;
  label: string;
  render?: (item: T) => unknown;
}

// ---------------------------------------------------------------------------
// ConsultationTimeline
// ---------------------------------------------------------------------------

export interface ConsultationTimelineProps {
  petId: string;
  limit?: number;
  /** Mapa consultationId -> monto total de servicios. Si se omite no muestra montos. */
  totalsMap?: Record<string, number>;
  onConsultationClick?: (consultation: Consultation) => void;
  /** Callback al presionar "Ver todas". Si se omite, el botón no se muestra. */
  onViewAll?: () => void;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// ConsultationCard
// ---------------------------------------------------------------------------

export interface ConsultationCardProps {
  consultation: Consultation;
  amount?: number | null;
  onClick?: (consultation: Consultation) => void;
  actions?: ActionDef<Consultation>[];
  className?: string;
}

// ---------------------------------------------------------------------------
// ConsultationForm
// ---------------------------------------------------------------------------

export interface ConsultationFormProps {
  consultationId?: string;
  petId?: string;
  defaults?: Partial<ConsultationCreateData>;
  onSuccess?: (consultation: Consultation) => void;
  onCancel?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// ConsultationDetail
// ---------------------------------------------------------------------------

export interface PetInfo {
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  sex: string | null;
}

export interface ConsultationDetailProps {
  consultationId: string;
  /** Datos de la mascota. Si se omite, el componente no muestra info de mascota. */
  pet?: PetInfo | null;
  extraSections?: SectionDef[];
  extraActions?: ActionDef<Consultation>[];
  onEdit?: (consultation: Consultation) => void;
  onDelete?: (consultation: Consultation) => void;
  onBack?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// CreateConsultationButton
// ---------------------------------------------------------------------------

export interface CreateConsultationButtonProps {
  /** ID del paciente. Si se omite, muestra PetPicker para seleccionarlo. */
  petId?: string;
  /** Valores por defecto para pre-llenar el formulario */
  defaults?: Partial<ConsultationCreateData>;
  label?: string;
  onSuccess?: (consultation: Consultation) => void;
  onCancel?: () => void;
  variant?: 'primary' | 'outline';
  /** Modo controlado: si se provee, no renderiza el botón y el caller maneja la apertura */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// MedicationList
// ---------------------------------------------------------------------------

export interface MedicationListProps {
  medications: ConsultationMedication[];
  className?: string;
}

// ---------------------------------------------------------------------------
// MedicationFormList (editable)
// ---------------------------------------------------------------------------

export interface MedicationFormListProps {
  medications: MedicationInput[];
  onChange: (medications: MedicationInput[]) => void;
  className?: string;
}
