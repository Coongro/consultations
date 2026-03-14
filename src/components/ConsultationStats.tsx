/**
 * Tarjetas de estadísticas de consultas.
 * Usa StatCard de @coongro/ui-components.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useConsultationStats } from '../hooks/useConsultationStats.js';

const React = getHostReact();
const UI = getHostUI();

export interface ConsultationStatsProps {
  layout?: 'row' | 'grid';
  className?: string;
}

export function ConsultationStats(props: ConsultationStatsProps) {
  const { layout = 'row', className = '' } = props;

  const { stats, loading, error } = useConsultationStats();

  if (error) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error al cargar estadísticas',
      message: error,
    });
  }

  const containerClass =
    layout === 'grid' ? `grid grid-cols-2 gap-4 ${className}` : `flex gap-4 ${className}`;

  if (loading) {
    return React.createElement(
      'div',
      { className: containerClass },
      Array.from({ length: 2 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'flex-1 h-20 rounded-xl' })
      )
    );
  }

  if (!stats) return null;

  return React.createElement(
    'div',
    { className: containerClass },
    React.createElement(UI.StatCard, {
      size: 'compact',
      label: 'Consultas registradas',
      value: stats.total,
      icon: React.createElement(UI.DynamicIcon, {
        icon: 'ClipboardList',
        size: 18,
        className: 'text-cg-text-muted',
      }),
    }),
    React.createElement(UI.StatCard, {
      size: 'compact',
      variant: stats.pendingFollowUps > 0 ? 'warning' : 'default',
      label: 'Controles pendientes',
      value: stats.pendingFollowUps,
      icon: React.createElement(UI.DynamicIcon, {
        icon: 'Bell',
        size: 18,
        className: stats.pendingFollowUps > 0 ? 'text-cg-warning' : 'text-cg-text-muted',
      }),
    })
  );
}
