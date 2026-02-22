/**
 * Timeline cronologico de consultas de una mascota.
 * Componente principal para integracion en la ficha de paciente.
 */
import { getHostReact, getHostUI, actions } from '@coongro/plugin-sdk';

import { useConsultationsByPet } from '../hooks/useConsultationsByPet.js';
import { useConsultationsSettings } from '../hooks/useConsultationsSettings.js';
import type { ConsultationTimelineProps } from '../types/components.js';
import type { Consultation } from '../types/consultation.js';

import { ConsultationCard } from './ConsultationCard.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useRef } = React;

export function ConsultationTimeline(props: ConsultationTimelineProps) {
  const {
    petId,
    limit = 5,
    onConsultationClick,
    showCreateButton = false,
    onCreateClick,
    className = '',
  } = props;

  const { consultations, total, loading, error } = useConsultationsByPet({
    petId,
    limit,
  });
  const { settings: consultSettings } = useConsultationsSettings();

  // Cargar totales de servicios para cada consulta
  const [totalsMap, setTotalsMap] = useState<Record<string, number>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!consultSettings.showPrices || consultations.length === 0) return;
    const ids = consultations.map((c: Consultation) => c.id);
    void (async () => {
      try {
        const result = await actions.execute<Record<string, number>>(
          'consultations.services.totalsByConsultations',
          { consultationIds: ids },
        );
        if (mountedRef.current) setTotalsMap(result ?? {});
      } catch {
        // Silenciar - si falla, simplemente no muestra montos
      }
    })();
  }, [consultations, consultSettings.showPrices]);

  if (loading) {
    return React.createElement(UI.LoadingOverlay, {
      variant: 'skeleton',
      rows: 3,
      className,
    });
  }

  if (error) {
    return React.createElement('p', { className: 'text-sm text-[var(--cg-danger)]' }, error);
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-3 ${className}` },

    // Header
    React.createElement(
      'div',
      { className: 'flex items-center justify-between' },
      React.createElement(
        'span',
        { className: 'text-xs text-[var(--cg-text-muted)]' },
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
            amount: consultSettings.showPrices ? (totalsMap[c.id] ?? null) : null,
            onClick: onConsultationClick,
          })
        ),

    // "Ver mas" si hay mas consultas
    total > limit &&
      consultations.length > 0 &&
      React.createElement(
        UI.Button,
        {
          variant: 'link',
          size: 'sm',
          onClick: onConsultationClick
            ? () => {
                /* Se podria navegar a la lista completa */
              }
            : undefined,
          className: 'self-center',
        },
        `Ver las ${total} consultas →`
      )
  );
}
