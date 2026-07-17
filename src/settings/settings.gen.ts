/**
 * AUTO-GENERADO por Coongro Builder — NO editar a mano.
 * Se regenera al guardar la página de settings desde /dev/builder.
 * La lógica de negocio va en un hook de dominio que consume esto.
 */
/* eslint-disable */

import { useSettings } from '@coongro/plugin-sdk';

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

/** Tipo de cada setting por su key punteada (para getSetting). */
export interface ConsultationsSettingsByKey {
  'consultations.showPrices': boolean;
  'consultations.prefillVitals': boolean;
  'consultations.structuredExam': boolean;
  'consultations.required.reason': boolean;
  'consultations.required.diagnosis': boolean;
}

/** Settings del plugin con defaults aplicados y coerción por tipo. */
export interface ConsultationsSettings {
  /** Servicios y precios en consultas — Mostrar la sección de servicios prestados y precios en el formulario de consulta · `consultations.showPrices` · default: `true` */
  readonly showPrices: boolean;
  /** Prellenar signos vitales — Al crear una consulta, prellenar peso, temperatura, FC, FR y BCS con los valores de la última consulta del paciente · `consultations.prefillVitals` · default: `true` */
  readonly prefillVitals: boolean;
  /** Examen físico estructurado — Mostrar checklist por sistemas (WNL/ABN) en vez de texto libre para el examen físico · `consultations.structuredExam` · default: `true` */
  readonly structuredExam: boolean;
  /** Motivo obligatorio — Requerir el motivo de consulta para poder guardar. · `consultations.required.reason` · default: `true` */
  readonly requiredReason: boolean;
  /** Diagnóstico obligatorio — Requerir el diagnóstico para poder guardar la consulta. · `consultations.required.diagnosis` · default: `false` */
  readonly requiredDiagnosis: boolean;
}

/** Nombre de prop → key punteada del manifest. */
export const SETTING_KEYS = {
  showPrices: 'consultations.showPrices',
  prefillVitals: 'consultations.prefillVitals',
  structuredExam: 'consultations.structuredExam',
  requiredReason: 'consultations.required.reason',
  requiredDiagnosis: 'consultations.required.diagnosis',
} as const;

/** Valores por defecto (los mismos del manifest). */
export const SETTING_DEFAULTS = {
  'consultations.showPrices': true,
  'consultations.prefillVitals': true,
  'consultations.structuredExam': true,
  'consultations.required.reason': true,
  'consultations.required.diagnosis': false,
} as const;

const COERCE: {
  [K in keyof ConsultationsSettingsByKey]: (
    values: Record<string, unknown>
  ) => ConsultationsSettingsByKey[K];
} = {
  'consultations.showPrices': (values) => toBool(values['consultations.showPrices'], true),
  'consultations.prefillVitals': (values) => toBool(values['consultations.prefillVitals'], true),
  'consultations.structuredExam': (values) => toBool(values['consultations.structuredExam'], true),
  'consultations.required.reason': (values) =>
    toBool(values['consultations.required.reason'], true),
  'consultations.required.diagnosis': (values) =>
    toBool(values['consultations.required.diagnosis'], false),
};

/** Lee UNA setting tipada desde los valores crudos del tenant (para handlers). */
export function getSetting<K extends keyof ConsultationsSettingsByKey>(
  values: Record<string, unknown>,
  key: K
): ConsultationsSettingsByKey[K] {
  return COERCE[key](values);
}

/** Construye el objeto tipado desde los valores crudos (sin hook: handlers/tests). */
export function readConsultationsSettings(values: Record<string, unknown>): ConsultationsSettings {
  return {
    showPrices: COERCE['consultations.showPrices'](values),
    prefillVitals: COERCE['consultations.prefillVitals'](values),
    structuredExam: COERCE['consultations.structuredExam'](values),
    requiredReason: COERCE['consultations.required.reason'](values),
    requiredDiagnosis: COERCE['consultations.required.diagnosis'](values),
  };
}

/**
 * Hook reactivo: settings tipadas del plugin con defaults aplicados.
 * Envolvé esto en un hook de dominio si necesitás lógica de negocio.
 */
export function useConsultationsSettings(): { settings: ConsultationsSettings; loading: boolean } {
  const { values, loading } = useSettings('consultations.');
  return { settings: readConsultationsSettings(values), loading };
}
