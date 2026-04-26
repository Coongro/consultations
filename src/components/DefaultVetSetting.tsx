/**
 * Componente custom de settings para seleccionar el veterinario predeterminado.
 * Se renderiza en la pagina de settings de Consultas como seccion custom.
 */
import { getHostReact, getHostUI, settings } from '@coongro/plugin-sdk';
import { StaffPicker } from '@coongro/staff';
import type { StaffMember } from '@coongro/staff';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

const SETTING_KEY = 'consultations.defaultStaffId';

export function DefaultVetSetting() {
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      { style: { width: '220px', flexShrink: 0 } },
      React.createElement(StaffPicker, {
        value: staffId,
        onChange: handleChange,
        placeholder: 'Seleccionar...',
      })
    )
  );
}
