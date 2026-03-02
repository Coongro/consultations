/**
 * Lista editable de medicamentos para el formulario de consulta.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { MedicationFormListProps } from '../types/components.js';
import type { MedicationInput } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback } = React;

const EMPTY_MEDICATION: MedicationInput = {
  name: '',
  dosage: null,
  frequency: null,
  duration: null,
  notes: null,
};

export function MedicationFormList({
  medications,
  onChange,
  className = '',
}: MedicationFormListProps) {
  const add = useCallback(() => {
    onChange([...medications, { ...EMPTY_MEDICATION }]);
  }, [medications, onChange]);

  const remove = useCallback(
    (index: number) => {
      onChange(medications.filter((_: MedicationInput, i: number) => i !== index));
    },
    [medications, onChange]
  );

  const updateField = useCallback(
    (index: number, field: keyof MedicationInput, value: string) => {
      const updated = medications.map((med: MedicationInput, i: number) =>
        i === index ? { ...med, [field]: value || null } : med
      );
      onChange(updated);
    },
    [medications, onChange]
  );

  return React.createElement(
    UI.TooltipProvider,
    null,
    React.createElement(
      'div',
      { className: `flex flex-col gap-2 ${className}` },

      medications.map((med: MedicationInput, index: number) =>
        React.createElement(
          'div',
          {
            key: index,
            className:
              'grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-start p-2 rounded-lg border border-[var(--cg-border)] bg-[var(--cg-bg-secondary)]',
          },

          // Nombre (requerido)
          React.createElement(UI.Input, {
            type: 'text',
            placeholder: 'Medicamento *',
            value: med.name,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(index, 'name', e.target.value),
            size: 'sm',
          }),

          // Dosis
          React.createElement(UI.Input, {
            type: 'text',
            placeholder: 'Ej: 2ml, 1 comp.',
            value: med.dosage ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(index, 'dosage', e.target.value),
            className: 'w-24',
            size: 'sm',
          }),

          // Frecuencia
          React.createElement(UI.Input, {
            type: 'text',
            placeholder: 'Ej: cada 8hs',
            value: med.frequency ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(index, 'frequency', e.target.value),
            className: 'w-28',
            size: 'sm',
          }),

          // Duración
          React.createElement(UI.Input, {
            type: 'text',
            placeholder: 'Ej: 7 días',
            value: med.duration ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(index, 'duration', e.target.value),
            className: 'w-24',
            size: 'sm',
          }),

          // Botón eliminar
          React.createElement(
            UI.Tooltip,
            { content: 'Eliminar medicamento' },
            React.createElement(
              UI.IconButton,
              {
                variant: 'danger',
                size: 'xs',
                onClick: () => remove(index),
              },
              React.createElement(UI.DynamicIcon, { icon: 'X', size: 16 })
            )
          )
        )
      ),

      // Botón agregar
      React.createElement(
        UI.Button,
        {
          type: 'button',
          variant: 'outline',
          size: 'sm',
          onClick: add,
          className: 'border-dashed',
        },
        React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 14 }),
        'Agregar medicamento'
      )
    )
  );
}
