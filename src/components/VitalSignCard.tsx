/**
 * Tarjeta de signo vital reutilizable.
 * Muestra ícono + label + valor en un formato compacto.
 * Usado en ConsultationDetail (panel lateral) y potencialmente en otros contextos.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

const React = getHostReact();
const UI = getHostUI();

export interface VitalSignCardProps {
  icon: string;
  label: string;
  value: string;
  className?: string;
}

export function VitalSignCard({ icon, label, value, className = '' }: VitalSignCardProps) {
  return React.createElement(
    'div',
    { className: `flex items-center gap-2 p-3 rounded-lg bg-cg-bg-secondary ${className}` },
    React.createElement(UI.DynamicIcon, {
      icon,
      size: 16,
      className: 'text-cg-text-muted shrink-0',
    }),
    React.createElement(
      'div',
      null,
      React.createElement('span', { className: 'text-xs text-cg-text-muted block' }, label),
      React.createElement('span', { className: 'text-sm font-semibold text-cg-text' }, value)
    )
  );
}
