/**
 * Lista editable de medicamentos con campos estructurados y collapse/expand.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { DOSAGE_UNITS, ROUTES, FREQUENCY_HOURS, DURATION_UNITS } from '../constants/medication.js';
import type { MedicationFormListProps } from '../types/components.js';
import type { MedicationInput } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

const EMPTY_MEDICATION: MedicationInput = {
  name: '',
  dosage_amount: null,
  dosage_unit: 'mg/kg',
  route: 'Oral',
  frequency_hours: null,
  duration_amount: null,
  duration_unit: 'días',
  notes: null,
};

function formatSummary(med: MedicationInput): string {
  const parts: string[] = [];
  if (med.dosage_amount && med.dosage_unit) parts.push(`${med.dosage_amount} ${med.dosage_unit}`);
  if (med.route) parts.push(med.route);
  if (med.frequency_hours) parts.push(`c/${String(med.frequency_hours)}h`);
  if (med.duration_amount && med.duration_unit)
    parts.push(`${String(med.duration_amount)} ${med.duration_unit}`);
  return parts.join(' · ');
}

function isMedicationComplete(med: MedicationInput): boolean {
  return !!(med.name.trim() && med.dosage_amount && med.frequency_hours && med.duration_amount);
}

export function MedicationFormList({
  medications,
  onChange,
  className = '',
}: MedicationFormListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const add = useCallback(() => {
    const newIndex = medications.length;
    onChange([...medications, { ...EMPTY_MEDICATION }]);
    setExpandedIndex(newIndex);
  }, [medications, onChange]);

  const remove = useCallback(
    (index: number) => {
      onChange(medications.filter((_: MedicationInput, i: number) => i !== index));
      if (expandedIndex === index) setExpandedIndex(null);
      else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
    },
    [medications, onChange, expandedIndex]
  );

  const updateField = useCallback(
    (index: number, field: keyof MedicationInput, value: string | number | null) => {
      const updated = medications.map((med: MedicationInput, i: number) =>
        i === index ? { ...med, [field]: value === '' ? null : value } : med
      );
      onChange(updated);
    },
    [medications, onChange]
  );

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedIndex(expandedIndex === index ? null : index);
    },
    [expandedIndex]
  );

  return React.createElement(
    UI.TooltipProvider,
    null,
    React.createElement(
      'div',
      { className: `flex flex-col gap-2 ${className}` },

      medications.map((med: MedicationInput, index: number) => {
        const isExpanded = expandedIndex === index;
        const hasName = med.name.trim().length > 0;
        const complete = isMedicationComplete(med);
        const summary = formatSummary(med);

        // Fila colapsada
        if (!isExpanded) {
          return React.createElement(
            'div',
            {
              key: index,
              className: `flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                complete
                  ? 'border-[var(--cg-border)] bg-[var(--cg-bg-secondary)]'
                  : 'border-dashed border-[var(--cg-border)] bg-[var(--cg-bg-secondary)]'
              }`,
              onClick: () => toggleExpand(index),
            },
            // Chevron
            React.createElement(
              'span',
              { className: 'text-[var(--cg-text-muted)] text-xs shrink-0' },
              '\u25B6'
            ),
            // Pill del nombre
            hasName
              ? React.createElement(
                  'span',
                  {
                    className: `px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      complete
                        ? 'bg-[var(--cg-bg)] text-[var(--cg-text)]'
                        : 'bg-[var(--cg-warning-bg)] text-[var(--cg-warning-text)]'
                    }`,
                  },
                  med.name
                )
              : React.createElement(
                  'span',
                  { className: 'text-xs text-[var(--cg-text-muted)] italic' },
                  'Sin nombre'
                ),
            // Resumen
            summary &&
              React.createElement(
                'span',
                { className: 'text-xs text-[var(--cg-text-muted)] truncate min-w-0' },
                summary
              ),
            // Badge incompleto
            !complete &&
              hasName &&
              React.createElement(UI.Badge, { variant: 'warning-soft', size: 'sm' }, 'Incompleto'),
            // Spacer
            React.createElement('span', { className: 'flex-1' }),
            // Eliminar
            React.createElement(
              UI.IconButton,
              {
                variant: 'danger',
                size: 'xs',
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  remove(index);
                },
              },
              React.createElement(UI.DynamicIcon, { icon: 'X', size: 14 })
            )
          );
        }

        // Card expandida
        return React.createElement(
          'div',
          {
            key: index,
            className:
              'flex flex-col gap-3 p-3 rounded-lg border-[1.5px] border-[var(--cg-border)] bg-[var(--cg-surface)]',
          },

          // Header expandido
          React.createElement(
            'div',
            {
              className: 'flex items-center gap-2 cursor-pointer',
              onClick: () => toggleExpand(index),
            },
            React.createElement(
              'span',
              { className: 'text-[var(--cg-text-muted)] text-xs' },
              '\u25BC'
            ),
            hasName &&
              React.createElement(
                'span',
                {
                  className:
                    'px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cg-bg)] text-[var(--cg-text)]',
                },
                med.name
              ),
            React.createElement('span', { className: 'flex-1' }),
            React.createElement(
              UI.IconButton,
              {
                variant: 'danger',
                size: 'xs',
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  remove(index);
                },
              },
              React.createElement(UI.DynamicIcon, { icon: 'X', size: 14 })
            )
          ),

          // Separador
          React.createElement('div', {
            className: 'border-t border-[var(--cg-border)]',
          }),

          // Nombre
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Medicamento *'),
            React.createElement(UI.Input, {
              type: 'text',
              placeholder: 'Ej: Amoxicilina, Meloxicam...',
              value: med.name,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                updateField(index, 'name', e.target.value),
              size: 'sm',
              autoFocus: !hasName,
            })
          ),

          // Fila 1: Dosis + Via + Duracion (compound fields get más ancho que Vía)
          React.createElement(
            'div',
            {
              className: 'grid grid-cols-2 sm:grid-cols-[2fr_1fr_2fr] gap-2',
            },

            // Dosis (compound: numero + select)
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1 min-w-0' },
              React.createElement(UI.Label, null, 'Dosis *'),
              React.createElement(
                'div',
                { className: 'flex gap-1 min-w-0' },
                React.createElement(UI.Input, {
                  type: 'number',
                  step: '0.01',
                  min: '0',
                  placeholder: '0',
                  value: med.dosage_amount ?? '',
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField(index, 'dosage_amount', e.target.value),
                  size: 'sm',
                  className: 'w-20',
                }),
                React.createElement(
                  'div',
                  { className: 'flex-1 min-w-0' },
                  React.createElement(
                    UI.Select,
                    {
                      value: med.dosage_unit ?? 'mg/kg',
                      onValueChange: (v: string) => updateField(index, 'dosage_unit', v),
                    },
                    DOSAGE_UNITS.map((unit) =>
                      React.createElement(UI.SelectItem, { key: unit, value: unit }, unit)
                    )
                  )
                )
              )
            ),

            // Via
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1 min-w-0' },
              React.createElement(UI.Label, null, 'Vía'),
              React.createElement(
                UI.Select,
                {
                  value: med.route ?? 'Oral',
                  onValueChange: (v: string) => updateField(index, 'route', v),
                },
                ROUTES.map((route) =>
                  React.createElement(UI.SelectItem, { key: route, value: route }, route)
                )
              )
            ),

            // Duracion (compound: numero + select)
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1 min-w-0' },
              React.createElement(UI.Label, null, 'Duración *'),
              React.createElement(
                'div',
                { className: 'flex gap-1 min-w-0' },
                React.createElement(UI.Input, {
                  type: 'number',
                  step: '1',
                  min: '1',
                  placeholder: '0',
                  value: med.duration_amount !== null ? String(med.duration_amount) : '',
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField(
                      index,
                      'duration_amount',
                      e.target.value ? Number(e.target.value) : null
                    ),
                  size: 'sm',
                  className: 'w-16',
                }),
                React.createElement(
                  'div',
                  { className: 'flex-1 min-w-0' },
                  React.createElement(
                    UI.Select,
                    {
                      value: med.duration_unit ?? 'días',
                      onValueChange: (v: string) => updateField(index, 'duration_unit', v),
                    },
                    DURATION_UNITS.map((unit) =>
                      React.createElement(UI.SelectItem, { key: unit, value: unit }, unit)
                    )
                  )
                )
              )
            )
          ),

          // Fila 2: Frecuencia (input + chips presets)
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Frecuencia *'),
            React.createElement(
              'div',
              { className: 'flex flex-wrap items-center gap-1.5' },
              React.createElement(
                'div',
                { className: 'flex items-center gap-1' },
                React.createElement(UI.Input, {
                  type: 'number',
                  step: '1',
                  min: '1',
                  placeholder: 'Cada...',
                  value: med.frequency_hours !== null ? String(med.frequency_hours) : '',
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField(
                      index,
                      'frequency_hours',
                      e.target.value ? Number(e.target.value) : null
                    ),
                  size: 'sm',
                  className: 'w-20',
                }),
                React.createElement(
                  'span',
                  { className: 'text-xs text-[var(--cg-text-muted)]' },
                  'hs'
                )
              ),
              ...FREQUENCY_HOURS.map((h) =>
                React.createElement(
                  UI.Chip,
                  {
                    key: String(h),
                    variant: med.frequency_hours === h ? 'brand' : 'default',
                    onClick: () => updateField(index, 'frequency_hours', h),
                    className: 'cursor-pointer',
                    size: 'sm',
                  },
                  `${String(h)}h`
                )
              )
            )
          ),

          // Notas
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement(UI.Label, null, 'Notas'),
            React.createElement(UI.Input, {
              type: 'text',
              placeholder: 'Indicaciones para este medicamento...',
              value: med.notes ?? '',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                updateField(index, 'notes', e.target.value),
              size: 'sm',
            })
          ),

          // Preview de resumen
          summary &&
            React.createElement(
              'div',
              {
                className:
                  'text-xs text-[var(--cg-text-muted)] bg-[var(--cg-bg)] rounded px-2 py-1',
              },
              `Vista colapsada: ${med.name || '...'} · ${summary}`
            )
        );
      }),

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
