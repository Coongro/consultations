/**
 * Formulario para crear/editar consultas con secciones colapsables de datos clínicos.
 */
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
import type { MedicationInput, ServiceLineInput } from '../types/consultation.js';
// ALL_REASON_CATEGORIES y REASON_CATEGORY_LABELS removidos del form (chips eliminados del diseño v3)

import { MedicationFormList } from './MedicationFormList.js';
import { ServiceLineForm } from './ServiceLineForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useRef, useMemo } = React;

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return React.createElement(
    'h3',
    { className: 'flex items-center gap-2 text-sm font-medium text-cg-text-muted' },
    React.createElement(UI.DynamicIcon, { icon, size: 14, className: 'text-cg-text-muted' }),
    title
  );
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

  // Estado del formulario
  const [vetName, setVetName] = useState(defaults?.vet_name ?? '');
  const [date, setDate] = useState(defaults?.date ?? new Date().toISOString().slice(0, 16));
  const [weightKg, setWeightKg] = useState(defaults?.weight_kg ?? '');
  const [temperature, setTemperature] = useState(defaults?.temperature ?? '');
  const [reason, setReason] = useState(defaults?.reason ?? '');
  const [clinicalExamOpen, setClinicalExamOpen] = useState(false);
  const [anamnesis, setAnamnesis] = useState(defaults?.anamnesis ?? '');
  const [physicalExam, setPhysicalExam] = useState(defaults?.physical_exam ?? '');
  const [diagnosis, setDiagnosis] = useState(defaults?.diagnosis ?? '');
  const [treatment, setTreatment] = useState(defaults?.treatment ?? '');
  const [followUpDate, setFollowUpDate] = useState(defaults?.follow_up_date ?? '');
  const [notes, setNotes] = useState(defaults?.notes ?? '');
  const [medications, setMedications] = useState<MedicationInput[]>(defaults?.medications ?? []);
  const [serviceLines, setServiceLines] = useState<ServiceLineInput[]>(defaults?.services ?? []);

  // Catálogo de servicios para ServiceLineForm
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

  // Subcategorías de servicios para el modal de creación
  const serviceSubcategories = useMemo(() => {
    const root = serviceCategories.find((c: Category) => c.slug === ROOT_SERVICE_CATEGORY_SLUG);
    if (!root) return [];
    return serviceCategories.filter((c: Category) => c.parent_id === root.id);
  }, [serviceCategories]);

  const handleProductCreated = useCallback((product: Product) => {
    setServiceCatalog((prev) => [...prev, product]);
  }, []);

  // Contribuciones de otros plugins (ej: vet-pharmacy inyecta selector de medicamentos)
  const { sections: contributedSections } = useViewContributions('consultations.form.open', {
    onMedicationsChange: setMedications,
  });

  // Precargar peso del paciente al crear consulta nueva
  useEffect(() => {
    if (isEditing || weightKg) return;
    const targetPetId = petId ?? defaults?.pet_id;
    if (!targetPetId) return;
    void (async () => {
      try {
        const pet = await actions.execute<{ weight_kg: string | null } | undefined>(
          'patients.pets.getById',
          { id: targetPetId }
        );
        if (pet?.weight_kg) setWeightKg(pet.weight_kg);
      } catch {
        // patients plugin puede no estar instalado
      }
    })();
  }, [petId, defaults?.pet_id, isEditing, weightKg]);

  // Cargar defaults del settings
  useEffect(() => {
    if (!isEditing && consultSettings.defaultVet && !vetName) {
      setVetName(consultSettings.defaultVet);
    }
  }, [consultSettings.defaultVet, isEditing, vetName]);

  // Cargar datos existentes al editar
  useEffect(() => {
    if (existing) {
      setVetName(existing.vet_name);
      setDate(existing.date.slice(0, 16));
      setWeightKg(existing.weight_kg ?? '');
      setTemperature(existing.temperature ?? '');
      setReason(existing.reason);
      if (existing.anamnesis || existing.physical_exam) setClinicalExamOpen(true);
      setAnamnesis(existing.anamnesis ?? '');
      setPhysicalExam(existing.physical_exam ?? '');
      setDiagnosis(existing.diagnosis ?? '');
      setTreatment(existing.treatment ?? '');
      setFollowUpDate(existing.follow_up_date ?? '');
      setNotes(existing.notes ?? '');
    }
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

      // Filtrar medicamentos vacios
      const validMeds = medications.filter((m: MedicationInput) => m.name.trim());

      // Filtrar service lines vacias
      const validServices = serviceLines.filter((s: ServiceLineInput) => s.product_name.trim());

      if (isEditing && consultationId) {
        const result = await update(consultationId, {
          vet_name: vetName.trim(),
          date: new Date(date).toISOString(),
          weight_kg: weightKg || null,
          temperature: temperature || null,
          reason: reason.trim(),
          reason_category: null,
          anamnesis: anamnesis.trim() || null,
          physical_exam: physicalExam.trim() || null,
          diagnosis: diagnosis.trim() || null,
          treatment: treatment.trim() || null,
          follow_up_date: followUpDate || null,
          follow_up_notes: null,
          notes: notes.trim() || null,
          services: validServices,
        });
        if (result && onSuccess) onSuccess(result);
      } else {
        const targetPetId = petId ?? defaults?.pet_id;
        if (!targetPetId) {
          toast.error('Error', 'No se especificó un paciente');
          return;
        }

        const result = await create({
          pet_id: targetPetId,
          vet_name: vetName.trim(),
          date: new Date(date).toISOString(),
          weight_kg: weightKg || null,
          temperature: temperature || null,
          reason: reason.trim(),
          reason_category: null,
          anamnesis: anamnesis.trim() || null,
          physical_exam: physicalExam.trim() || null,
          diagnosis: diagnosis.trim() || null,
          treatment: treatment.trim() || null,
          follow_up_date: followUpDate || null,
          follow_up_notes: null,
          notes: notes.trim() || null,
          medications: validMeds,
          services: validServices,
        });
        if (result && onSuccess) onSuccess(result);
      }
    },
    [
      consultationId,
      petId,
      defaults,
      isEditing,
      vetName,
      date,
      weightKg,
      temperature,
      reason,
      anamnesis,
      physicalExam,
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

  return React.createElement(
    'form',
    { onSubmit: handleSubmit, className: `flex flex-col gap-4 ${className}` },

    // Seccion 1: Datos basicos
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'ClipboardList', title: 'Datos básicos' }),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
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
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Fecha y hora'),
            React.createElement(UI.Input, {
              type: 'datetime-local',
              value: date,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value),
            })
          )
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Peso (kg)'),
            React.createElement(UI.Input, {
              type: 'number',
              step: '0.1',
              min: '0',
              max: '200',
              value: weightKg,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setWeightKg(e.target.value),
              placeholder: 'ej: 28.5',
            })
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Temperatura (°C)'),
            React.createElement(UI.Input, {
              type: 'number',
              step: '0.1',
              min: '35',
              max: '42',
              value: temperature,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTemperature(e.target.value),
              placeholder: 'ej: 38.5',
            })
          )
        )
      )
    ),

    // Seccion 2: Servicios prestados (siempre visible) + Motivo
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'Receipt', title: 'Servicios prestados' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1' },
          React.createElement(UI.Label, null, 'Motivo *'),
          React.createElement(UI.Input, {
            type: 'text',
            value: reason,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value),
            placeholder: 'Ej: Control anual, vacunación, vómitos...',
            required: true,
          })
        ),
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

    // Seccion 3: Examen clínico (colapsable, cerrado por defecto)
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'div',
          {
            className: 'flex items-center gap-2 cursor-pointer select-none',
            onClick: () => setClinicalExamOpen(!clinicalExamOpen),
          },
          React.createElement(
            'span',
            { className: 'text-xs text-cg-text-muted' },
            clinicalExamOpen ? '\u25BC' : '\u25B6'
          ),
          React.createElement(UI.DynamicIcon, {
            icon: 'Stethoscope',
            size: 14,
            className: 'text-cg-text-muted',
          }),
          React.createElement(
            'h3',
            { className: 'text-sm font-medium text-cg-text-muted' },
            'Examen clínico'
          ),
          !clinicalExamOpen &&
            (anamnesis || physicalExam) &&
            React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, 'Con datos')
        ),
        clinicalExamOpen &&
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Anamnesis'),
            React.createElement(UI.Textarea, {
              value: anamnesis,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setAnamnesis(e.target.value),
              placeholder: 'Lo que reporta el dueño...',
              rows: 2,
            })
          ),
        clinicalExamOpen &&
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Examen físico'),
            React.createElement(UI.Textarea, {
              value: physicalExam,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPhysicalExam(e.target.value),
              placeholder: 'Hallazgos del examen...',
              rows: 2,
            })
          )
      )
    ),

    // Seccion 4: Diagnóstico
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'SearchCheck', title: 'Diagnóstico' }),
        React.createElement(UI.Textarea, {
          value: diagnosis,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosis(e.target.value),
          placeholder: 'Diagnóstico...',
          rows: 2,
        })
      )
    ),

    // Seccion 5: Tratamiento + Medicamentos
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'Pill', title: 'Tratamiento' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1' },
          React.createElement(UI.Label, null, 'Indicaciones generales'),
          React.createElement(UI.Input, {
            type: 'text',
            value: treatment,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTreatment(e.target.value),
            placeholder: 'Ej: Dieta blanda, reposo, collar isabelino...',
          })
        ),
        React.createElement(UI.Label, null, 'Medicación'),
        // Si hay contribuciones de otros plugins, usarlas; si no, fallback al formulario nativo
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
            ])
      )
    ),

    // Seccion 6: Seguimiento (notas unificadas)
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(SectionHeader, { icon: 'CalendarCheck', title: 'Seguimiento' }),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Próximo control'),
            React.createElement(UI.Input, {
              type: 'date',
              value: followUpDate,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFollowUpDate(e.target.value),
            })
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
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

    // Botones
    React.createElement(
      'div',
      { className: 'flex justify-end gap-3' },
      onCancel &&
        React.createElement(
          UI.Button,
          {
            type: 'button',
            variant: 'outline',
            onClick: onCancel,
          },
          'Cancelar'
        ),
      React.createElement(
        UI.Button,
        {
          type: 'submit',
          disabled: saving,
        },
        saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar consulta'
      )
    )
  );
}
