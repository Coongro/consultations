/**
 * Formulario para crear/editar consultas. 6 secciones segun spec.
 */
import { getHostReact, getHostUI, usePlugin, useViewContributions } from '@coongro/plugin-sdk';

import { useConsultation } from '../hooks/useConsultation.js';
import { useConsultationMutations } from '../hooks/useConsultationMutations.js';
import { useConsultationsSettings } from '../hooks/useConsultationsSettings.js';
import type { ConsultationFormProps } from '../types/components.js';
import type { MedicationInput, ServiceLineInput } from '../types/consultation.js';
import { ALL_REASON_CATEGORIES, REASON_CATEGORY_LABELS } from '../utils/labels.js';

import { MedicationFormList } from './MedicationFormList.js';
import { ServiceLineForm } from './ServiceLineForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect } = React;

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
  const [reasonCategory, setReasonCategory] = useState(defaults?.reason_category ?? '');
  const [anamnesis, setAnamnesis] = useState(defaults?.anamnesis ?? '');
  const [physicalExam, setPhysicalExam] = useState(defaults?.physical_exam ?? '');
  const [diagnosis, setDiagnosis] = useState(defaults?.diagnosis ?? '');
  const [treatment, setTreatment] = useState(defaults?.treatment ?? '');
  const [followUpDate, setFollowUpDate] = useState(defaults?.follow_up_date ?? '');
  const [followUpNotes, setFollowUpNotes] = useState(defaults?.follow_up_notes ?? '');
  const [notes, setNotes] = useState(defaults?.notes ?? '');
  const [medications, setMedications] = useState<MedicationInput[]>(defaults?.medications ?? []);
  const [serviceLines, setServiceLines] = useState<ServiceLineInput[]>(defaults?.services ?? []);

  // Contribuciones de otros plugins (ej: vet-pharmacy inyecta selector de medicamentos)
  const { sections: contributedSections } = useViewContributions('consultations.form.open', {
    onMedicationsChange: setMedications,
  });

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
      setReasonCategory(existing.reason_category ?? '');
      setAnamnesis(existing.anamnesis ?? '');
      setPhysicalExam(existing.physical_exam ?? '');
      setDiagnosis(existing.diagnosis ?? '');
      setTreatment(existing.treatment ?? '');
      setFollowUpDate(existing.follow_up_date ?? '');
      setFollowUpNotes(existing.follow_up_notes ?? '');
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  useEffect(() => {
    if (existingMeds.length > 0) {
      setMedications(
        existingMeds.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
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
          reason_category: reasonCategory || null,
          anamnesis: anamnesis.trim() || null,
          physical_exam: physicalExam.trim() || null,
          diagnosis: diagnosis.trim() || null,
          treatment: treatment.trim() || null,
          follow_up_date: followUpDate || null,
          follow_up_notes: followUpNotes.trim() || null,
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
          reason_category: reasonCategory || null,
          anamnesis: anamnesis.trim() || null,
          physical_exam: physicalExam.trim() || null,
          diagnosis: diagnosis.trim() || null,
          treatment: treatment.trim() || null,
          follow_up_date: followUpDate || null,
          follow_up_notes: followUpNotes.trim() || null,
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
      reasonCategory,
      anamnesis,
      physicalExam,
      diagnosis,
      treatment,
      followUpDate,
      followUpNotes,
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
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
          'Datos básicos'
        ),
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

    // Seccion 2: Motivo
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
          'Motivo de consulta'
        ),
        consultSettings.reasonCategoriesEnabled &&
          React.createElement(
            'div',
            { className: 'flex flex-wrap gap-2' },
            ALL_REASON_CATEGORIES.map((cat) =>
              React.createElement(
                UI.Chip,
                {
                  key: cat,
                  variant: reasonCategory === cat ? 'brand' : 'default',
                  onClick: () => setReasonCategory(reasonCategory === cat ? '' : cat),
                  className: 'cursor-pointer',
                },
                REASON_CATEGORY_LABELS[cat]
              )
            )
          ),
        React.createElement(UI.Textarea, {
          value: reason,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value),
          placeholder: 'Motivo de la consulta *',
          rows: 2,
          required: true,
        })
      )
    ),

    // Seccion 3: Examen clinico
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
          'Examen clínico'
        ),
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

    // Seccion 4: Diagnostico
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
          'Diagnóstico'
        ),
        React.createElement(UI.Textarea, {
          value: diagnosis,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosis(e.target.value),
          placeholder: 'Diagnóstico...',
          rows: 2,
        })
      )
    ),

    // Seccion 5: Servicios prestados (condicional)
    consultSettings.showPrices &&
      React.createElement(
        UI.Card,
        { className: 'p-4' },
        React.createElement(
          'div',
          { className: 'flex flex-col gap-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
            'Servicios prestados'
          ),
          React.createElement(ServiceLineForm, {
            services: serviceLines,
            onChange: setServiceLines,
          })
        )
      ),

    // Seccion 6: Tratamiento + Medicamentos
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
          'Tratamiento'
        ),
        React.createElement(UI.Textarea, {
          value: treatment,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setTreatment(e.target.value),
          placeholder: 'Plan de tratamiento...',
          rows: 2,
        }),
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

    // Seccion 7: Seguimiento
    React.createElement(
      UI.Card,
      { className: 'p-4' },
      React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
          'Seguimiento'
        ),
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
            React.createElement(UI.Label, null, 'Notas de seguimiento'),
            React.createElement(UI.Input, {
              type: 'text',
              value: followUpNotes,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setFollowUpNotes(e.target.value),
              placeholder: 'Indicaciones para el próximo control...',
            })
          )
        ),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1' },
          React.createElement(UI.Label, null, 'Notas generales'),
          React.createElement(UI.Textarea, {
            value: notes,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value),
            placeholder: 'Observaciones adicionales...',
            rows: 2,
          })
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
