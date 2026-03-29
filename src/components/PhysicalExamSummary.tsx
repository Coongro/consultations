/**
 * Resumen de examen físico por sistemas.
 * Muestra la lista de sistemas con estado WNL/ABN y notas.
 * Reutilizable en ConsultationDetail, exports para otros plugins.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { PhysicalExamSystem } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();

export interface PhysicalExamSummaryProps {
  systems: PhysicalExamSystem[];
  /** Si true, solo muestra los sistemas con hallazgos (ABN o con notas) */
  onlyAbnormal?: boolean;
  className?: string;
}

export function PhysicalExamSummary({
  systems,
  onlyAbnormal = false,
  className = '',
}: PhysicalExamSummaryProps) {
  const filtered = onlyAbnormal ? systems.filter((s) => s.status === 'ABN' || s.notes) : systems;

  if (filtered.length === 0) return null;

  return React.createElement(
    'div',
    { className: `flex flex-col gap-1 ${className}` },
    ...filtered.map((sys) =>
      React.createElement(
        'div',
        {
          key: sys.system,
          className: `flex items-center gap-3 py-1.5 px-2 rounded ${
            sys.status === 'ABN' ? 'bg-cg-danger-bg' : ''
          }`,
        },
        React.createElement(
          UI.Badge,
          {
            variant: sys.status === 'ABN' ? 'destructive' : 'secondary',
            size: 'sm',
            className: 'font-mono w-12 justify-center',
          },
          sys.status
        ),
        React.createElement(
          'span',
          { className: 'text-sm text-cg-text w-40 shrink-0 truncate' },
          sys.system
        ),
        sys.notes &&
          React.createElement('span', { className: 'text-sm text-cg-text-muted' }, sys.notes)
      )
    )
  );
}
