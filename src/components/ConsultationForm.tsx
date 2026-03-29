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
import { PetPicker } from '@coongro/patients';
import type { Pet } from '@coongro/patients';
import {
  getHostReact,
  getHostUI,
  usePlugin,
  useViewContributions,
  actions,
} from '@coongro/plugin-sdk';
import type { Product, Category } from '@coongro/products';

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
  const { consultationId, petId, defaults, onSuccess, onCancel, className = '' } = props;

  const { toast } = usePlugin();
  const { settings: consultSettings } = useConsultationsSettings();
  const { create, update, creating, updating } = useConsultationMutations();
  const {
    consultation: existing,
    medications: existingMeds,
    services: existingServices,
  } = useConsultation(consultationId);

  const isEditing = !!consultationId;
  const saving = creating || updating;

  // --- Estado del formulario ---
  const [selectedPetId, setSelectedPetId] = useState(petId ?? defaults?.pet_id ?? '');
  const [vetName, setVetName] = useState(defaults?.vet_name ?? '');
  const [date, setDate] = useState(defaults?.date ?? new Date().toISOString().slice(0, 16));

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
  const [followUpDate, setFollowUpDate] = useState(defaults?.follow_up_date ?? '');
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

  // Cargar defaults del settings
  useEffect(() => {
    if (!isEditing && consultSettings.defaultVet && !vetName) {
      setVetName(consultSettings.defaultVet);
    }
  }, [consultSettings.defaultVet, isEditing, vetName]);

  // Cargar datos existentes al editar
  useEffect(() => {
    if (!existing) return;
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
      if (!vetName.trim()) {
        toast.error('Error', 'El nombre del veterinario es obligatorio');
        return;
      }

      const validMeds = medications.filter((m: MedicationInput) => m.name.trim());
      const validServices = serviceLines.filter((s: ServiceLineInput) => s.product_name.trim());

      // Solo guardar sistemas con hallazgos (ABN o con notas)
      const examData = examSystems.some((s) => s.status === 'ABN' || s.notes.trim())
        ? examSystems
        : null;

      const sharedData = {
        vet_name: vetName.trim(),
        date: new Date(date).toISOString(),
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
        follow_up_date: followUpDate || null,
        follow_up_notes: null,
        notes: notes.trim() || null,
      };

      if (isEditing && consultationId) {
        const result = await update(consultationId, {
          ...sharedData,
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
        if (result && onSuccess) onSuccess(result);
      }
    },
    [
      consultationId,
      selectedPetId,
      defaults,
      isEditing,
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
    { onSubmit: handleSubmit, className: `flex flex-col gap-4 ${className}` },

    // ── Sección 1: Datos básicos + Paciente ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'ClipboardList', title: 'Datos básicos' }),

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
            { className: FIELD_GAP },
            React.createElement(UI.Label, null, 'Veterinario *'),
            React.createElement(UI.Input, {
              type: 'text',
              value: vetName,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setVetName(e.target.value),
              placeholder: 'Nombre del veterinario',
              required: true,
            })
          ),
          React.createElement(
            'div',
            { className: FIELD_GAP },
            React.createElement(UI.Label, null, 'Fecha y hora'),
            React.createElement(UI.Input, {
              type: 'datetime-local',
              value: date,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value),
            })
          )
        )
      )
    ),

    // ── Sección 2: Signos vitales ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'HeartPulse', title: 'Signos vitales' }),
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
      )
    ),

    // ── Sección 3 (S): Motivo + Anamnesis ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, {
          icon: 'MessageSquare',
          title: 'S — Motivo y anamnesis',
        }),
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
      )
    ),

    // ── Sección 4 (O): Examen físico ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, {
          icon: 'Stethoscope',
          title: 'O — Examen físico',
        }),

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
      )
    ),

    // ── Sección 5 (A): Diagnóstico ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'SearchCheck', title: 'A — Diagnóstico' }),
        React.createElement(UI.Textarea, {
          value: diagnosis,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosis(e.target.value),
          placeholder: 'Diagnóstico presuntivo o definitivo...',
          rows: 2,
        })
      )
    ),

    // ── Sección 6 (P): Tratamiento + Medicamentos + Seguimiento ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'Pill', title: 'P — Plan de tratamiento' }),
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
          { className: GRID_2 },
          React.createElement(
            'div',
            { className: FIELD_GAP },
            React.createElement(UI.Label, null, 'Próximo control'),
            React.createElement(UI.Input, {
              type: 'date',
              value: followUpDate,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFollowUpDate(e.target.value),
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
      )
    ),

    // ── Sección 7: Servicios prestados ──
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'Receipt', title: 'Servicios prestados' }),
        React.createElement(ServiceLineForm, {
          services: serviceLines,
          onChange: setServiceLines,
          catalog: serviceCatalog,
          categories: serviceSubcategories,
          catalogLoading,
          onProductCreated: handleProductCreated,
          showPrices: consultSettings.showPrices,
        })
      )
    ),

    // ── Botones ──
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
