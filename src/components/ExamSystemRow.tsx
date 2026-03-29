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
      className: `grid grid-cols-[48px_160px_1fr] items-center gap-2 p-2 rounded-lg ${
        isAbnormal ? 'bg-cg-danger-bg' : 'bg-cg-bg-secondary'
      } ${className}`,
    },
    React.createElement(
      UI.Button,
      {
        type: 'button',
        variant: isAbnormal ? 'destructive' : 'outline',
        size: 'sm',
        className: 'w-12 text-xs font-mono',
        onClick: onStatusToggle,
      },
      system.status
    ),
    React.createElement('span', { className: 'text-sm text-cg-text truncate' }, system.system),
    React.createElement(UI.Input, {
      type: 'text',
      value: system.notes,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onNotesChange(e.target.value),
      placeholder: isAbnormal ? 'Describir hallazgo...' : 'Sin observaciones',
      className: 'text-sm',
    })
  );
}
