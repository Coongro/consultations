/**
 * Timeline cronologico de consultas de una mascota.
 * Componente principal para integracion en la ficha de paciente.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useConsultationsByPet } from '../hooks/useConsultationsByPet.js';
import type { ConsultationTimelineProps } from '../types/components.js';
import type { Consultation } from '../types/consultation.js';

import { ConsultationCard } from './ConsultationCard.js';

const React = getHostReact();
const UI = getHostUI();

export function ConsultationTimeline(props: ConsultationTimelineProps) {
  const {
    petId,
    limit = 5,
    totalsMap = {},
    onConsultationClick,
    showCreateButton = false,
    onCreateClick,
    className = '',
  } = props;

  const { consultations, total, loading, error } = useConsultationsByPet({
    petId,
    limit,
  });

  if (loading) {
    return React.createElement(UI.LoadingOverlay, {
      variant: 'skeleton',
      rows: 3,
      className,
    });
  }

  if (error) {
    return React.createElement('p', { className: 'text-sm text-cg-danger' }, error);
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-3 ${className}` },

    // Encabezado
    React.createElement(
      'div',
      { className: 'flex items-center justify-between' },
      React.createElement(
        'span',
        { className: 'text-xs text-cg-text-muted' },
        total > 0 ? `${total} consulta${total === 1 ? '' : 's'}` : ''
      ),
      showCreateButton &&
        onCreateClick &&
        React.createElement(
          UI.Button,
          {
            size: 'xs',
            onClick: onCreateClick,
          },
          React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 14 }),
          'Nueva Consulta'
        )
    ),

    // Lista de consultas
    consultations.length === 0
      ? React.createElement(UI.EmptyState, {
          title: 'Sin consultas registradas',
        })
      : consultations.map((c: Consultation) =>
          React.createElement(ConsultationCard, {
            key: c.id,
            consultation: c,
            amount: totalsMap[c.id] ?? null,
            onClick: onConsultationClick,
          })
        ),

    // "Ver mas" si hay mas consultas
    total > limit &&
      consultations.length > 0 &&
      React.createElement(
        UI.Button,
        { variant: 'link', size: 'sm', className: 'self-center' },
        `Ver las ${total} consultas \u2192`
      )
  );
}
