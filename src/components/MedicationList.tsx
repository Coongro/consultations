/**
 * Lista de medicamentos de una consulta (solo lectura).
 * Cada medicamento se muestra como una mini-card con sus detalles.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { MedicationListProps } from '../types/components.js';

const React = getHostReact();
const UI = getHostUI();

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
    medications.map((med) =>
      React.createElement(
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
            med.name,
          ),
        ),
        // Detalles como chips
        (med.dosage || med.frequency || med.duration) &&
          React.createElement(
            'div',
            { className: 'flex flex-wrap gap-1.5 pl-[22px] mt-2' },
            med.dosage &&
              React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, `Dosis: ${med.dosage}`),
            med.frequency &&
              React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, `Frecuencia: ${med.frequency}`),
            med.duration &&
              React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, `Duración: ${med.duration}`),
          ),
        // Notas
        med.notes &&
          React.createElement(
            'p',
            { className: 'text-xs text-[var(--cg-text-muted)] italic pl-[22px] mt-1' },
            med.notes,
          ),
      ),
    ),
  );
}
