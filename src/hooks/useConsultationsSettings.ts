/**
 * Hook para cargar configuraciones del plugin de consultas.
 */
import { getHostReact, settings } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect } = React;

export interface ConsultationsSettings {
  reasonCategoriesEnabled: boolean;
  defaultStaffId: string;
  showPrices: boolean;
  prefillVitals: boolean;
  structuredExam: boolean;
}

const DEFAULTS: Record<string, unknown> = {
  'consultations.reasonCategories': true,
  'consultations.defaultStaffId': '',
  'consultations.showPrices': true,
  'consultations.prefillVitals': true,
  'consultations.structuredExam': true,
};

function parseSettings(raw: Record<string, unknown>): ConsultationsSettings {
  const get = (key: string) => raw[key] ?? DEFAULTS[key];

  return {
    reasonCategoriesEnabled: get('consultations.reasonCategories') as boolean,
    defaultStaffId: (get('consultations.defaultStaffId') as string) || '',
    showPrices: get('consultations.showPrices') as boolean,
    prefillVitals: get('consultations.prefillVitals') as boolean,
    structuredExam: get('consultations.structuredExam') as boolean,
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
