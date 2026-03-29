/**
 * Fila de examen físico por sistema.
 * Muestra toggle WNL/ABN + nombre del sistema + input de notas, alineados.
 * Responsive: en mobile reduce el ancho del nombre del sistema.
 * Reutilizable en ConsultationForm y cualquier contexto que necesite
 * un checklist de examen por sistemas.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { EXAM_SYSTEM_EXAMPLES, type PhysicalExamSystem } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

export interface ExamSystemRowProps {
  system: PhysicalExamSystem;
  onStatusToggle: () => void;
  onNotesChange: (value: string) => void;
  compact?: boolean;
  className?: string;
}

export function ExamSystemRow({
  system,
  onStatusToggle,
  onNotesChange,
  compact = false,
  className = '',
}: ExamSystemRowProps) {
  const isAbnormal = system.status === 'ABN';
  const gridCols = compact ? '40px 100px 1fr' : '44px 140px 1fr';

  return React.createElement(
    'div',
    {
      className: `grid items-center gap-2 py-1.5 px-2 rounded transition-colors ${
        isAbnormal ? 'bg-cg-danger-bg' : ''
      } ${className}`,
      style: { gridTemplateColumns: gridCols },
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
      placeholder: EXAM_SYSTEM_EXAMPLES[system.system] ?? '',
      className: 'text-sm h-8',
    })
  );
}

/**
 * Contenedor responsive para la lista de ExamSystemRow.
 * Detecta el ancho disponible y pasa compact=true cuando es estrecho.
 */
export interface ExamSystemListProps {
  systems: PhysicalExamSystem[];
  onStatusToggle: (index: number) => void;
  onNotesChange: (index: number, value: string) => void;
  className?: string;
}

export function ExamSystemList({
  systems,
  onStatusToggle,
  onNotesChange,
  className = '',
}: ExamSystemListProps) {
  const [compact, setCompact] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const checkWidth = useCallback(() => {
    if (containerRef.current) {
      setCompact(containerRef.current.offsetWidth < 450);
    }
  }, []);

  useEffect(() => {
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [checkWidth]);

  return React.createElement(
    'div',
    {
      ref: containerRef,
      className: `flex flex-col divide-y divide-cg-border rounded-lg border border-cg-border overflow-hidden ${className}`,
    },
    ...systems.map((sys, idx) =>
      React.createElement(ExamSystemRow, {
        key: sys.system,
        system: sys,
        compact,
        onStatusToggle: () => onStatusToggle(idx),
        onNotesChange: (value: string) => onNotesChange(idx, value),
      })
    )
  );
}
