/**
 * Hook para cargar configuraciones del plugin de consultas.
 */
import { getHostReact, settings } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect } = React;

export interface ConsultationsSettings {
  reasonCategoriesEnabled: boolean;
  defaultVet: string;
  showPrices: boolean;
}

const DEFAULTS: Record<string, unknown> = {
  'consultations.reasonCategories': true,
  'consultations.defaultVet': '',
  'consultations.showPrices': true,
};

function parseSettings(raw: Record<string, unknown>): ConsultationsSettings {
  const get = (key: string) => raw[key] ?? DEFAULTS[key];

  return {
    reasonCategoriesEnabled: get('consultations.reasonCategories') as boolean,
    defaultVet: (get('consultations.defaultVet') as string) || '',
    showPrices: get('consultations.showPrices') as boolean,
  };
}

const DEFAULT_SETTINGS = parseSettings({});

export function useConsultationsSettings() {
  const [data, setData] = useState<ConsultationsSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const raw = await settings.getAll('consultations.');
        if (!cancelled) setData(parseSettings(raw));
      } catch {
        // Si falla, usar defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { settings: data, loading };
}
