/**
 * Card resumida de una consulta. Usada en el timeline y en listados.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { ConsultationCardProps } from '../types/components.js';
import {
  formatConsultationDate,
  formatReasonCategory,
  getReasonCategoryBadgeVariant,
  getReasonCategoryEmoji,
} from '../utils/labels.js';
import { formatCurrency } from '../utils/price.js';

const React = getHostReact();
const UI = getHostUI();

export function ConsultationCard(props: ConsultationCardProps) {
  const {
    consultation: c,
    showPetName: _showPetName,
    amount,
    onClick,
    actions: cardActions,
    className = '',
  } = props;

  const emoji = getReasonCategoryEmoji(c.reason_category);
  const badgeVariant = getReasonCategoryBadgeVariant(c.reason_category);
  const categoryLabel = formatReasonCategory(c.reason_category);
  const dateStr = formatConsultationDate(c.date);

  return React.createElement(
    UI.Card,
    {
      className: `p-3 ${onClick ? 'cursor-pointer hover:bg-[var(--cg-bg-hover)]' : ''} transition-colors ${className}`,
      onClick: onClick ? () => onClick(c) : undefined,
    },
    React.createElement(
      'div',
      { className: 'flex items-start gap-3' },

      // Emoji/icono
      React.createElement('span', { className: 'text-lg flex-shrink-0 mt-0.5' }, emoji),

      // Contenido
      React.createElement(
        'div',
        { className: 'flex-1 min-w-0' },

        // Primera linea: fecha + vet + categoria
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 flex-wrap' },
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-[var(--cg-text)]' },
            dateStr
          ),
          React.createElement(
            'span',
            { className: 'text-xs text-[var(--cg-text-muted)]' },
            `— ${c.vet_name}`
          ),
          categoryLabel &&
            React.createElement(
              UI.Badge,
              { variant: badgeVariant as 'info', size: 'sm' },
              categoryLabel
            )
        ),

        // Motivo
        React.createElement(
          'p',
          { className: 'text-sm text-[var(--cg-text)] mt-1 line-clamp-1' },
          c.reason
        ),

        // Diagnostico (si hay)
        c.diagnosis &&
          React.createElement(
            'p',
            { className: 'text-xs text-[var(--cg-text-muted)] mt-0.5 line-clamp-1' },
            `Dx: ${c.diagnosis}`
          ),

        // Indicadores: peso, temperatura, seguimiento
        React.createElement(
          'div',
          { className: 'flex items-center gap-3 mt-1 flex-wrap' },
          c.weight_kg &&
            React.createElement(
              'span',
              { className: 'text-xs text-[var(--cg-text-muted)]' },
              `⚖️ ${c.weight_kg} kg`
            ),
          c.temperature &&
            React.createElement(
              'span',
              { className: 'text-xs text-[var(--cg-text-muted)]' },
              `🌡️ ${c.temperature}°C`
            ),
          c.follow_up_date &&
            React.createElement(
              'span',
              { className: 'text-xs text-[var(--cg-text-muted)]' },
              `📅 Control: ${formatConsultationDate(c.follow_up_date)}`
            ),
          amount !== null &&
            amount !== undefined &&
            amount > 0 &&
            React.createElement(
              'span',
              { className: 'text-xs font-medium text-[var(--cg-accent)]' },
              formatCurrency(amount)
            )
        )
      ),

      // Acciones extra
      cardActions &&
        cardActions.length > 0 &&
        React.createElement(
          'div',
          { className: 'flex gap-1 flex-shrink-0' },
          cardActions.map((action, i) =>
            React.createElement(
              UI.Button,
              {
                key: i,
                variant: 'outline',
                size: 'xs',
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  action.onClick(c);
                },
              },
              action.label
            )
          )
        )
    )
  );
}
