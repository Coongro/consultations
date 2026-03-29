/**
 * Fila de examen físico por sistema.
 * Muestra toggle WNL/ABN + nombre del sistema + input de notas, alineados.
 * Reutilizable en ConsultationForm y cualquier contexto que necesite
 * un checklist de examen por sistemas.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { PhysicalExamSystem } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();

export interface ExamSystemRowProps {
  system: PhysicalExamSystem;
  onStatusToggle: () => void;
  onNotesChange: (value: string) => void;
  className?: string;
}

export function ExamSystemRow({
  system,
  onStatusToggle,
  onNotesChange,
  className = '',
}: ExamSystemRowProps) {
  const isAbnormal = system.status === 'ABN';

  return React.createElement(
    'div',
    {
      className: `grid items-center gap-3 py-1.5 px-2 rounded transition-colors ${
        isAbnormal ? 'bg-cg-danger-bg' : ''
      } ${className}`,
      style: { gridTemplateColumns: '44px 140px 1fr' },
    },
    React.createElement(
      'button',
      {
        type: 'button',
        className: `inline-flex items-center justify-center h-7 rounded text-xs font-mono font-medium transition-colors ${
          isAbnormal ? 'bg-cg-danger text-white' : 'text-cg-text-muted hover:bg-cg-bg-secondary'
        }`,
        onClick: onStatusToggle,
      },
      system.status
    ),
    React.createElement(
      'span',
      {
        className: `text-sm truncate ${isAbnormal ? 'text-cg-text font-medium' : 'text-cg-text-muted'}`,
      },
      system.system
    ),
    React.createElement(UI.Input, {
      type: 'text',
      value: system.notes,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onNotesChange(e.target.value),
      placeholder: isAbnormal ? 'Describir hallazgo...' : '',
      className: 'text-sm h-8',
    })
  );
}
