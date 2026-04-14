/**
 * Componente custom de settings para seleccionar el veterinario predeterminado.
 * Se renderiza en la pagina de settings de Consultas como seccion custom.
 */
import { getHostReact, getHostUI, settings } from '@coongro/plugin-sdk';
import { StaffPicker } from '@coongro/staff';
import type { StaffMember } from '@coongro/staff';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback, useRef } = React;

const SETTING_KEY = 'consultations.defaultStaffId';

/**
 * Fuerza el ComboboxChipTrigger a una sola linea.
 * El trigger usa flex-wrap que causa dos lineas cuando hay chip + input.
 */
function useCompactCombobox(containerRef: React.RefObject<HTMLDivElement>, hasValue: boolean) {
  useEffect(() => {
    if (!containerRef.current) return;
    const trigger = containerRef.current.querySelector<HTMLElement>('[role="combobox"]');
    if (!trigger) return;

    trigger.style.flexWrap = 'nowrap';
    trigger.style.overflow = 'hidden';

    const input = trigger.querySelector<HTMLInputElement>('input');
    if (input) {
      if (hasValue) {
        input.style.width = '0';
        input.style.minWidth = '0';
        input.style.padding = '0';
        input.style.opacity = '0';
        input.style.position = 'absolute';
      } else {
        input.style.width = '';
        input.style.minWidth = '';
        input.style.padding = '';
        input.style.opacity = '';
        input.style.position = '';
      }
    }
  }, [hasValue]);
}

export function DefaultVetSetting() {
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);

  useCompactCombobox(pickerRef, !!staffId);

  useEffect(() => {
    void (async () => {
      try {
        const value = await settings.get<string>(SETTING_KEY);
        if (value) setStaffId(value);
      } catch {
        // Sin valor guardado
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = useCallback((member: StaffMember | null) => {
    const newId = member?.id ?? null;
    setStaffId(newId);
    void settings.set(SETTING_KEY, newId ?? '');
  }, []);

  if (loading) {
    return React.createElement(UI.Skeleton, { className: 'h-10 w-full rounded-lg' });
  }

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        borderRadius: '12px',
        border: '1px solid var(--cg-border-subtle)',
        background: 'var(--cg-surface)',
        padding: '12px 16px',
      },
    },
    React.createElement(
      'div',
      { style: { minWidth: 0, flex: 1 } },
      React.createElement(
        'label',
        { style: { fontSize: '14px', fontWeight: 500, color: 'var(--cg-text)' } },
        'Veterinario predeterminado'
      ),
      React.createElement(
        'p',
        { style: { fontSize: '12px', color: 'var(--cg-text-subtle)', marginTop: '2px' } },
        'Se preselecciona al crear consultas nuevas'
      )
    ),
    React.createElement(
      'div',
      { ref: pickerRef, style: { width: '220px', flexShrink: 0 } },
      React.createElement(StaffPicker, {
        value: staffId,
        onChange: handleChange,
        placeholder: 'Seleccionar...',
      })
    )
  );
}
