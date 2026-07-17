/**
 * Hook de dominio para las configuraciones del plugin de consultas.
 * Delega los campos declarativos del manifest a la capa tipada generada
 * (`settings.gen.ts`) y agrega `defaultStaffId`, que NO es un item del manifest
 * (lo setea la sección custom `DefaultVetSetting`).
 */
import { getHostReact, settings } from '@coongro/plugin-sdk';

import { readConsultationsSettings } from '../settings/settings.gen.js';

const React = getHostReact();
const { useState, useEffect } = React;

export interface ConsultationsSettings {
  defaultStaffId: string;
  showPrices: boolean;
  prefillVitals: boolean;
  structuredExam: boolean;
  requireReason: boolean;
  requireDiagnosis: boolean;
}

function parseSettings(raw: Record<string, unknown>): ConsultationsSettings {
  const gen = readConsultationsSettings(raw);
  return {
    defaultStaffId: (raw['consultations.defaultStaffId'] as string) || '',
    showPrices: gen.showPrices,
    prefillVitals: gen.prefillVitals,
    structuredExam: gen.structuredExam,
    requireReason: gen.requiredReason,
    requireDiagnosis: gen.requiredDiagnosis,
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
