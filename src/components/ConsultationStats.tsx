/**
 * Tarjetas de estadísticas de consultas.
 * Usa StatCard + Skeleton de la librería UI compartida.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useConsultationStats } from '../hooks/useConsultationStats.js';

const React = getHostReact();
const UI = getHostUI();

interface StatDef {
  label: string;
  value: number;
  icon: string;
  footer?: string;
}

export interface ConsultationStatsProps {
  layout?: 'row' | 'grid';
  className?: string;
}

export function ConsultationStats(props: ConsultationStatsProps) {
  const { layout = 'row', className = '' } = props;

  const { stats, loading, error } = useConsultationStats();

  if (error) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error',
      message: 'Error al cargar estadísticas',
    });
  }

  // Construir las tarjetas de estadísticas a partir de los datos cargados
  const cards: StatDef[] = stats
    ? [
        {
          label: 'Total',
          value: stats.total,
          icon: '📋',
          footer: 'Consultas registradas',
        },
        {
          label: 'Controles pendientes',
          value: stats.pendingFollowUps,
          icon: '🔔',
          footer: 'Seguimientos programados',
        },
      ]
    : [];

  const gridClass =
    layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex gap-4 overflow-x-auto';

  if (loading) {
    return React.createElement(
      'div',
      { className: `${gridClass} ${className}` },
      Array.from({ length: 2 }).map((_, i) =>
        React.createElement(UI.Skeleton, {
          key: i,
          className: 'flex-1 min-w-[200px] h-[120px] rounded-2xl',
        })
      )
    );
  }

  return React.createElement(
    'div',
    { className: `${gridClass} ${className}` },
    cards.map((card, i) =>
      React.createElement(UI.StatCard, {
        key: i,
        label: card.label,
        value: card.value,
        className: 'flex-1 min-w-[200px]',
        icon: React.createElement('span', { className: 'text-2xl' }, card.icon),
        footer: card.footer,
      })
    )
  );
}
