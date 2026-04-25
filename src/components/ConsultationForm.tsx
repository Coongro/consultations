/**
 * Formulario para crear/editar consultas.
 * Organizado siguiendo flujo clínico SOAP:
 *   1. Datos básicos (vet, fecha) + Selector de paciente
 *   2. Signos vitales (peso, temperatura, FC, FR, BCS)
 *   3. S — Motivo + Anamnesis
 *   4. O — Examen físico por sistemas
 *   5. A — Diagnóstico
 *   6. P — Tratamiento + Medicamentos + Seguimiento
 *   7. Servicios prestados (facturación)
 */
import { DatePicker, DateTimePicker, TimePicker, useTenantTimezone } from '@coongro/calendar';
import { localToUTC, parseDateKey, toDateKey, utcToLocal } from '@coongro/datetime';
import { PetPicker } from '@coongro/patients';
import type { Pet } from '@coongro/patients';
import {
  getHostReact,
  getHostUI,
  usePlugin,
  useViewContributions,
  actions,
  settings,
} from '@coongro/plugin-sdk';
import type { Product, Category } from '@coongro/products';
import { StaffPicker } from '@coongro/staff';
import type { StaffMember } from '@coongro/staff';

import { ROOT_SERVICE_CATEGORY_SLUG } from '../constants/services.js';
import { useConsultation } from '../hooks/useConsultation.js';
import { useConsultationMutations } from '../hooks/useConsultationMutations.js';
import { useConsultationsSettings } from '../hooks/useConsultationsSettings.js';
import type { ConsultationFormProps } from '../types/components.js';
import {
  EXAM_SYSTEMS,
  type Consultation,
  type MedicationInput,
  type PhysicalExamSystem,
  type ServiceLineInput,
} from '../types/consultation.js';

import { ExamSystemList } from './ExamSystemRow.js';
import { MedicationFormList } from './MedicationFormList.js';
import { ServiceLineForm } from './ServiceLineForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useRef, useMemo } = React;

const FIELD_GAP = 'flex flex-col gap-1';
const GRID_2 = 'grid grid-cols-2 gap-3';

// Header inline para subsecciones (dentro de un FormSection)
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return React.createElement(
    'h3',
    { className: 'flex items-center gap-2 text-sm font-medium text-cg-text-muted' },
    React.createElement(UI.DynamicIcon, { icon, size: 14, className: 'text-cg-text-muted' }),
    title
  );
}

function buildDefaultExamSystems(): PhysicalExamSystem[] {
  return EXAM_SYSTEMS.map((system) => ({ system, status: 'WNL' as const, notes: '' }));
}

export function ConsultationForm(props: ConsultationFormProps) {
  const {
    consultationId,
    petId,
    defaults,
    onSuccess,
    onCancel,
    className = '',
    formRef,
    hideActions,
    onSavingChange,
  } = props;

  const { toast } = usePlugin();
  const tz = useTenantTimezone();
  const { settings: consultSettings } = useConsultationsSettings();
  const { create, update, creating, updating } = useConsultationMutations();
  const {
    consultation: existing,
    medications: existingMeds,
    services: existingServices,
  } = useConsultation(consultationId);

  const isEditing = !!consultationId;
  const saving = creating || updating;

  // Notificar al caller cuando cambia el estado de guardado (para footer externo)
  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

  // --- Estado del formulario ---
  const [selectedPetId, setSelectedPetId] = useState(petId ?? defaults?.pet_id ?? '');
  const [staffId, setStaffId] = useState<string | null>(defaults?.staff_id ?? null);
  const [vetName, setVetName] = useState(defaults?.vet_name ?? '');
  const [date, setDate] = useState(
    defaults?.date ?? utcToLocal(new Date(), tz).toFormat("yyyy-MM-dd'T'HH:mm")
  );

  // Signos vitales
  const [weightKg, setWeightKg] = useState(defaults?.weight_kg ?? '');
  const [temperature, setTemperature] = useState(defaults?.temperature ?? '');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [bcs, setBcs] = useState('');

  // SOAP
  const [reason, setReason] = useState(defaults?.reason ?? '');
  const [anamnesis, setAnamnesis] = useState(defaults?.anamnesis ?? '');
  const [examSystems, setExamSystems] = useState<PhysicalExamSystem[]>(buildDefaultExamSystems);
  const [physicalExamNotes, setPhysicalExamNotes] = useState(defaults?.physical_exam ?? '');
  const [diagnosis, setDiagnosis] = useState(defaults?.diagnosis ?? '');
  const [treatment, setTreatment] = useState(defaults?.treatment ?? '');
  const [medications, setMedications] = useState<MedicationInput[]>(defaults?.medications ?? []);
  const [followUpDate, setFollowUpDate] = useState<string>(defaults?.follow_up_date ?? '');
  const [followUpStartTime, setFollowUpStartTime] = useState<string>(
    defaults?.follow_up_start_time ?? '09:00'
  );
  const [followUpEndTime, setFollowUpEndTime] = useState<string>(
    defaults?.follow_up_end_time ?? '09:30'
  );
  const [notes, setNotes] = useState(defaults?.notes ?? '');

  // Servicios
  const [serviceLines, setServiceLines] = useState<ServiceLineInput[]>(defaults?.services ?? []);
  const [serviceCatalog, setServiceCatalog] = useState<Product[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const catalogMountedRef = useRef(true);

  useEffect(() => {
    catalogMountedRef.current = true;
    return () => {
      catalogMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const cats = await actions.execute<Category[]>('products.categories.listTree');
        if (!catalogMountedRef.current) return;
        setServiceCategories(cats);

        const root = cats.find((c: Category) => c.slug === ROOT_SERVICE_CATEGORY_SLUG);
        if (!root) {
          setCatalogLoading(false);
          return;
        }
        const serviceIds = new Set<string>([
          root.id,
          ...cats.filter((c: Category) => c.parent_id === root.id).map((c: Category) => c.id),
        ]);

        const all = await actions.execute<Product[]>('products.items.search', {
          limit: 300,
          isActive: true,
        });
        if (!catalogMountedRef.current) return;
        setServiceCatalog(all.filter((p: Product) => serviceIds.has(p.category_id ?? '')));
      } catch {
        // Sin catálogo
      } finally {
        if (catalogMountedRef.current) setCatalogLoading(false);
      }
    })();
  }, []);

  const serviceSubcategories = useMemo(() => {
    const root = serviceCategories.find((c: Category) => c.slug === ROOT_SERVICE_CATEGORY_SLUG);
    if (!root) return [];
    return serviceCategories.filter((c: Category) => c.parent_id === root.id);
  }, [serviceCategories]);

  const handleProductCreated = useCallback((product: Product) => {
    setServiceCatalog((prev) => [...prev, product]);
  }, []);

  const { sections: contributedSections } = useViewContributions('consultations.form.open', {
    onMedicationsChange: setMedications,
  });

  // --- PetPicker: sincronizar petId de prop ---
  useEffect(() => {
    if (petId) setSelectedPetId(petId);
  }, [petId]);

  const handlePetSelect = useCallback((pet: Pet | null) => {
    setSelectedPetId(pet?.id ?? '');
    if (pet?.weight_kg) setWeightKg(pet.weight_kg);
  }, []);

  const handleStaffSelect = useCallback((member: StaffMember | null) => {
    setStaffId(member?.id ?? null);
    setVetName(member?.contact_name ?? '');
  }, []);

  // Precargar signos vitales de la última consulta del paciente
  const vitalsLoadedRef = useRef(false);
  useEffect(() => {
    if (isEditing || vitalsLoadedRef.current || !consultSettings.prefillVitals) return;
    const targetPetId = selectedPetId || defaults?.pet_id;
    if (!targetPetId) return;
    vitalsLoadedRef.current = true;
    void (async () => {
      // Cargar peso desde ficha del paciente
      try {
        const pet = await actions.execute<{ weight_kg: string | null } | undefined>(
          'patients.pets.getById',
          { id: targetPetId }
        );
        if (pet?.weight_kg && !weightKg) setWeightKg(pet.weight_kg);
      } catch {
        // patients plugin puede no estar instalado
      }

      // Cargar vitales de la última consulta
      try {
        const lastConsultations = await actions.execute<Consultation[]>(
          'consultations.records.listByPet',
          { petId: targetPetId, limit: 1 }
        );
        const last = lastConsultations?.[0];
        if (!last) return;
        if (last.temperature && !temperature) setTemperature(last.temperature);
        if (last.heart_rate && !heartRate) setHeartRate(String(last.heart_rate));
        if (last.respiratory_rate && !respiratoryRate)
          setRespiratoryRate(String(last.respiratory_rate));
        if (last.body_condition_score && !bcs) setBcs(last.body_condition_score);
      } catch {
        // Primera consulta del paciente, sin datos previos
      }
    })();
  }, [selectedPetId, defaults?.pet_id, isEditing]);

  // Preseleccionar el ultimo veterinario usado: aplica staffId + nombre del staff
  useEffect(() => {
    if (isEditing || staffId || !consultSettings.defaultStaffId) return;
    const id = consultSettings.defaultStaffId;
    let cancelled = false;
    setStaffId(id);
    void actions
      .execute<StaffMember>('staff.members.getById', { id })
      .then((member) => {
        if (cancelled || !member) return;
        setVetName(member.contact_name);
      })
      .catch(() => {
        // Staff no encontrado: el setting puede haber quedado huérfano
      });
    return () => {
      cancelled = true;
    };
  }, [consultSettings.defaultStaffId, isEditing, staffId]);

  // Cargar datos existentes al editar
  useEffect(() => {
    if (!existing) return;
    setStaffId(existing.staff_id ?? null);
    setVetName(existing.vet_name);
    setDate(existing.date.slice(0, 16));
    setWeightKg(existing.weight_kg ?? '');
    setTemperature(existing.temperature ?? '');
    setHeartRate(existing.heart_rate !== null ? String(existing.heart_rate) : '');
    setRespiratoryRate(existing.respiratory_rate !== null ? String(existing.respiratory_rate) : '');
    setBcs(existing.body_condition_score ?? '');
    setReason(existing.reason);
    setAnamnesis(existing.anamnesis ?? '');
    if (existing.physical_exam_systems && Array.isArray(existing.physical_exam_systems)) {
      setExamSystems(existing.physical_exam_systems);
    }
    setPhysicalExamNotes(existing.physical_exam ?? '');
    setDiagnosis(existing.diagnosis ?? '');
    setTreatment(existing.treatment ?? '');
    setFollowUpDate(existing.follow_up_date ?? '');
    setFollowUpStartTime(existing.follow_up_start_time ?? '09:00');
    setFollowUpEndTime(existing.follow_up_end_time ?? '09:30');
    setNotes(existing.notes ?? '');
    setSelectedPetId(existing.pet_id);
  }, [existing]);

  useEffect(() => {
    if (existingMeds.length > 0) {
      setMedications(
        existingMeds.map((m) => ({
          name: m.name,
          dosage_amount: m.dosage_amount,
          dosage_unit: m.dosage_unit,
          route: m.route,
          frequency_hours: m.frequency_hours,
          duration_amount: m.duration_amount,
          duration_unit: m.duration_unit,
          notes: m.notes,
        }))
      );
    }
  }, [existingMeds]);

  useEffect(() => {
    if (existingServices.length > 0) {
      setServiceLines(
        existingServices.map((s) => ({
          product_id: s.product_id,
          product_name: s.product_name,
          quantity: s.quantity,
          unit_price: s.unit_price,
          subtotal: s.subtotal,
          notes: s.notes,
        }))
      );
    }
  }, [existingServices]);

  // --- Exam systems handlers ---
  const handleExamStatusToggle = useCallback((index: number) => {
    setExamSystems((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status: s.status === 'WNL' ? 'ABN' : 'WNL' } : s))
    );
  }, []);

  const handleExamNotesChange = useCallback((index: number, value: string) => {
    setExamSystems((prev) => prev.map((s, i) => (i === index ? { ...s, notes: value } : s)));
  }, []);

  // --- Submit ---
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!reason.trim()) {
        toast.error('Error', 'El motivo de consulta es obligatorio');
        return;
      }
      // staff_id es obligatorio: validación nativa del browser via input espejo en el form

      const validMeds = medications.filter((m: MedicationInput) => m.name.trim());
      const validServices = serviceLines.filter((s: ServiceLineInput) => s.product_name.trim());

      // Solo guardar sistemas con hallazgos (ABN o con notas)
      const examData = examSystems.some((s) => s.status === 'ABN' || s.notes.trim())
        ? examSystems
        : null;

      const sharedData = {
        staff_id: staffId || null,
        vet_name: vetName.trim(),
        date: localToUTC(date.slice(0, 10), date.slice(11, 16), tz),
        weight_kg: weightKg || null,
        temperature: temperature || null,
        heart_rate: heartRate ? parseInt(heartRate, 10) : null,
        respiratory_rate: respiratoryRate ? parseInt(respiratoryRate, 10) : null,
        body_condition_score: bcs || null,
        reason: reason.trim(),
        reason_category: null,
        anamnesis: anamnesis.trim() || null,
        physical_exam: physicalExamNotes.trim() || null,
        physical_exam_systems: examData,
        diagnosis: diagnosis.trim() || null,
        treatment: treatment.trim() || null,
        follow_up_date: followUpDate ? parseDateKey(followUpDate) : null,
        follow_up_start_time: followUpDate ? followUpStartTime : null,
        follow_up_end_time: followUpDate ? followUpEndTime : null,
        follow_up_notes: null,
        notes: notes.trim() || null,
      };

      if (isEditing && consultationId) {
        const result = await update(consultationId, {
          ...sharedData,
          medications: validMeds,
          services: validServices,
        });
        if (result && onSuccess) onSuccess(result);
      } else {
        const targetPetId = selectedPetId || defaults?.pet_id;
        if (!targetPetId) {
          toast.error('Error', 'Seleccioná un paciente');
          return;
        }

        const result = await create({
          ...sharedData,
          pet_id: targetPetId,
          medications: validMeds,
          services: validServices,
        });
        if (result && onSuccess) {
          // Recordar el veterinario para la proxima consulta
          if (staffId) {
            void settings.set('consultations.defaultStaffId', staffId);
          }
          onSuccess(result);
        }
      }
    },
    [
      consultationId,
      selectedPetId,
      defaults,
      isEditing,
      staffId,
      vetName,
      date,
      weightKg,
      temperature,
      heartRate,
      respiratoryRate,
      bcs,
      reason,
      anamnesis,
      examSystems,
      physicalExamNotes,
      diagnosis,
      treatment,
      followUpDate,
      followUpStartTime,
      followUpEndTime,
      notes,
      medications,
      serviceLines,
      create,
      update,
      onSuccess,
      toast,
    ]
  );

  // Si no hay petId, necesitamos mostrar PetPicker
  const needsPetPicker = !petId && !consultationId;

  return React.createElement(
    'form',
    { ref: formRef, onSubmit: handleSubmit, className: `flex flex-col gap-4 ${className}` },

    // ── Sección 1: Datos básicos + Paciente ──
    React.createElement(
      UI.FormSection,
      { icon: 'ClipboardList', title: 'Datos básicos' },

      // PetPicker (solo cuando no viene petId por parámetro)
      needsPetPicker &&
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Paciente *'),
          React.createElement(PetPicker, {
            value: selectedPetId || undefined,
            onChange: handlePetSelect,
            placeholder: 'Buscar paciente por nombre, raza o microchip...',
          })
        ),

      React.createElement(
        'div',
        { className: GRID_2 },
        React.createElement(
          'div',
          { className: FIELD_GAP, style: { position: 'relative' } },
          React.createElement(UI.Label, null, 'Veterinario *'),
          React.createElement(StaffPicker, {
            value: staffId,
            onChange: handleStaffSelect,
            placeholder: 'Buscar veterinario...',
          }),
          // Input espejo para validación nativa "required" sobre el StaffPicker
          React.createElement('input', {
            type: 'text',
            tabIndex: -1,
            required: true,
            'aria-label': 'Veterinario',
            value: staffId ?? '',
            onChange: () => {},
            style: {
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none',
            },
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Fecha y hora'),
          React.createElement(DateTimePicker, {
            value: date,
            onChange: setDate,
            step: 30,
          })
        )
      )
    ),

    // ── Sección 2: Signos vitales ──
    React.createElement(
      UI.FormSection,
      { icon: 'HeartPulse', title: 'Signos vitales' },
      React.createElement(
        'div',
        { className: 'grid grid-cols-3 sm:grid-cols-5 gap-3' },
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Peso (kg)'),
          React.createElement(UI.Input, {
            type: 'number',
            step: '0.1',
            min: '0',
            max: '200',
            value: weightKg,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setWeightKg(e.target.value),
            placeholder: '28.5',
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Temp. (°C)'),
          React.createElement(UI.Input, {
            type: 'number',
            step: '0.1',
            min: '35',
            max: '42',
            value: temperature,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTemperature(e.target.value),
            placeholder: '38.5',
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'FC (lpm)'),
          React.createElement(UI.Input, {
            type: 'number',
            min: '0',
            max: '300',
            value: heartRate,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHeartRate(e.target.value),
            placeholder: '120',
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'FR (rpm)'),
          React.createElement(UI.Input, {
            type: 'number',
            min: '0',
            max: '100',
            value: respiratoryRate,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setRespiratoryRate(e.target.value),
            placeholder: '20',
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'BCS (1-9)'),
          React.createElement(UI.Input, {
            type: 'number',
            min: '1',
            max: '9',
            step: '0.5',
            value: bcs,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setBcs(e.target.value),
            placeholder: '5',
          })
        )
      )
    ),

    // ── Sección 3 (S): Motivo + Anamnesis ──
    React.createElement(
      UI.FormSection,
      { icon: 'MessageSquare', title: 'S — Motivo y anamnesis' },
      React.createElement(
        'div',
        { className: FIELD_GAP },
        React.createElement(UI.Label, null, 'Motivo de consulta *'),
        React.createElement(UI.Input, {
          type: 'text',
          value: reason,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value),
          placeholder: 'Ej: Control anual, vacunación, vómitos...',
          required: true,
        })
      ),
      React.createElement(
        'div',
        { className: FIELD_GAP },
        React.createElement(UI.Label, null, 'Anamnesis'),
        React.createElement(UI.Textarea, {
          value: anamnesis,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setAnamnesis(e.target.value),
          placeholder: 'Lo que reporta el dueño: síntomas, duración, cambios de hábitos...',
          rows: 3,
        })
      )
    ),

    // ── Sección 4 (O): Examen físico ──
    React.createElement(
      UI.FormSection,
      { icon: 'Stethoscope', title: 'O — Examen físico' },

      // Checklist por sistemas (si structuredExam habilitado)
      consultSettings.structuredExam &&
        React.createElement(ExamSystemList, {
          systems: examSystems,
          onStatusToggle: handleExamStatusToggle,
          onNotesChange: handleExamNotesChange,
        }),

      // Textarea libre (siempre visible como notas adicionales si structured, o como único campo si no)
      React.createElement(
        'div',
        { className: FIELD_GAP },
        React.createElement(
          UI.Label,
          null,
          consultSettings.structuredExam ? 'Notas generales del examen' : 'Examen físico'
        ),
        React.createElement(UI.Textarea, {
          value: physicalExamNotes,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setPhysicalExamNotes(e.target.value),
          placeholder: consultSettings.structuredExam
            ? 'Observaciones adicionales del examen físico...'
            : 'Hallazgos del examen físico...',
          rows: consultSettings.structuredExam ? 2 : 4,
        })
      )
    ),

    // ── Sección 5 (A): Diagnóstico ──
    React.createElement(
      UI.FormSection,
      { icon: 'SearchCheck', title: 'A — Diagnóstico' },
      React.createElement(UI.Textarea, {
        value: diagnosis,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosis(e.target.value),
        placeholder: 'Diagnóstico presuntivo o definitivo...',
        rows: 2,
      })
    ),

    // ── Sección 6 (P): Tratamiento + Medicamentos + Seguimiento ──
    React.createElement(
      UI.FormSection,
      { icon: 'Pill', title: 'P — Plan de tratamiento' },
      React.createElement(
        'div',
        { className: FIELD_GAP },
        React.createElement(UI.Label, null, 'Indicaciones generales'),
        React.createElement(UI.Input, {
          type: 'text',
          value: treatment,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTreatment(e.target.value),
          placeholder: 'Ej: Dieta blanda, reposo, collar isabelino...',
        })
      ),
      React.createElement(UI.Label, null, 'Medicación'),
      ...(contributedSections.length > 0
        ? contributedSections.map((s, i) =>
            React.createElement(
              React.Fragment,
              { key: `contrib-${String(i)}` },
              s.render() as React.ReactNode
            )
          )
        : [
            React.createElement(MedicationFormList, {
              key: 'native-meds',
              medications,
              onChange: setMedications,
            }),
          ]),
      React.createElement(UI.Separator, { className: 'my-1' }),
      React.createElement(SectionHeader, { icon: 'CalendarCheck', title: 'Seguimiento' }),
      React.createElement(
        'div',
        { className: 'grid grid-cols-4 gap-3' },
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Próximo control'),
          React.createElement(DatePicker, {
            value: followUpDate,
            onChange: setFollowUpDate,
            placeholder: 'Seleccionar fecha',
            minDate: toDateKey(new Date(), tz),
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Inicio'),
          React.createElement(TimePicker, {
            value: followUpStartTime,
            onChange: (t: string) => {
              setFollowUpStartTime(t);
              const [h, m] = t.split(':').map(Number);
              const endMin = h * 60 + m + 30;
              setFollowUpEndTime(
                `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
              );
            },
            step: 30,
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Fin'),
          React.createElement(TimePicker, {
            value: followUpEndTime,
            onChange: setFollowUpEndTime,
            step: 30,
          })
        ),
        React.createElement(
          'div',
          { className: FIELD_GAP },
          React.createElement(UI.Label, null, 'Notas'),
          React.createElement(UI.Input, {
            type: 'text',
            value: notes,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value),
            placeholder: 'Observaciones, indicaciones para el próximo control...',
          })
        )
      )
    ),

    // ── Sección 7: Servicios prestados ──
    React.createElement(
      UI.FormSection,
      { icon: 'Receipt', title: 'Servicios prestados' },
      React.createElement(ServiceLineForm, {
        services: serviceLines,
        onChange: setServiceLines,
        catalog: serviceCatalog,
        categories: serviceSubcategories,
        catalogLoading,
        onProductCreated: handleProductCreated,
        showPrices: consultSettings.showPrices,
      })
    ),

    // ── Botones (solo si el caller no los pone en el footer del dialog) ──
    !hideActions &&
      React.createElement(
        'div',
        { className: 'flex justify-end gap-3' },
        onCancel &&
          React.createElement(
            UI.Button,
            { type: 'button', variant: 'outline', onClick: onCancel },
            'Cancelar'
          ),
        React.createElement(
          UI.Button,
          { type: 'submit', disabled: saving },
          saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar consulta'
        )
      )
  );
}
