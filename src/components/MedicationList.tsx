/**
 * Lista de medicamentos de una consulta (solo lectura).
 * Muestra campos estructurados como badges formateados.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { FREQUENCY_LABELS } from '../constants/medication.js';
import type { MedicationListProps } from '../types/components.js';
import type { ConsultationMedication } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();

function formatDosage(med: ConsultationMedication): string | null {
  if (!med.dosage_amount || !med.dosage_unit) return null;
  return `${med.dosage_amount} ${med.dosage_unit}`;
}

function formatFrequency(med: ConsultationMedication): string | null {
  if (!med.frequency_hours) return null;
  return FREQUENCY_LABELS[med.frequency_hours] ?? `Cada ${String(med.frequency_hours)}h`;
}

function formatDuration(med: ConsultationMedication): string | null {
  if (!med.duration_amount || !med.duration_unit) return null;
  return `${String(med.duration_amount)} ${med.duration_unit}`;
}

export function MedicationList(props: MedicationListProps) {
  const { medications, className = '' } = props;

  if (medications.length === 0) {
    return React.createElement(UI.EmptyState, {
      title: 'Sin medicación prescrita',
    });
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-3 ${className}` },
    medications.map((med) => {
      const dosage = formatDosage(med);
      const frequency = formatFrequency(med);
      const duration = formatDuration(med);
      const hasDetails = dosage || med.route || frequency || duration;

      return React.createElement(
        UI.Card,
        { key: med.id, className: 'p-3' },
        // Nombre del medicamento
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(UI.DynamicIcon, {
            icon: 'Pill',
            size: 14,
            className: 'text-[var(--cg-accent)] shrink-0',
          }),
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-[var(--cg-text)]' },
            med.name
          )
        ),
        // Detalles como badges
        hasDetails &&
          React.createElement(
            'div',
            { className: 'flex flex-wrap gap-1.5 pl-[22px] mt-2' },
            dosage && React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, dosage),
            med.route &&
              React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, med.route),
            frequency &&
              React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, frequency),
            duration &&
              React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, duration)
          ),
        // Notas
        med.notes &&
          React.createElement(
            'p',
            { className: 'text-xs text-[var(--cg-text-muted)] italic pl-[22px] mt-1' },
            med.notes
          )
      );
    })
  );
}
