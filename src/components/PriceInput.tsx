/**
 * Input de precio con prefijo "$" y sanitización automática.
 * Reutilizable en ServiceFormDialog, ServiceLineForm y cualquier formulario con precios.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { sanitizePrice } from '../utils/price.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback } = React;

export interface PriceInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
}

export function PriceInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = '0,00',
  hasError = false,
  errorMessage,
  disabled = false,
}: PriceInputProps) {
  const prefixId = id ? `${id}-prefix` : undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitizePrice(e.target.value));
    },
    [onChange]
  );

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'relative' },
      React.createElement(
        'span',
        {
          id: prefixId,
          className:
            'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cg-text-muted pointer-events-none',
          'aria-hidden': 'true',
        },
        '$'
      ),
      React.createElement(UI.Input, {
        id,
        type: 'text',
        inputMode: 'decimal',
        value,
        onChange: handleChange,
        onBlur,
        placeholder,
        disabled,
        className: `pl-7 tabular-nums ${hasError ? 'border-cg-danger' : ''}`,
        'aria-describedby': prefixId,
        'aria-invalid': hasError || undefined,
      })
    ),
    hasError &&
      errorMessage &&
      React.createElement('p', { className: 'text-xs text-cg-danger', role: 'alert' }, errorMessage)
  );
}
