/**
 * Constantes de medicacion estructurada.
 * Exportables para uso cross-plugin (vet-pharmacy puede importarlas).
 */

export const DOSAGE_UNITS = ['mg/kg', 'mg', 'ml', 'UI/kg', 'gotas', 'comp.'] as const;
export type DosageUnit = (typeof DOSAGE_UNITS)[number];

export const ROUTES = ['Oral', 'IM', 'IV', 'SC', 'Tópica', 'Oftálmica', 'Ótica'] as const;
export type Route = (typeof ROUTES)[number];

export const FREQUENCY_HOURS = [6, 8, 12, 24, 48, 72] as const;
export type FrequencyHours = (typeof FREQUENCY_HOURS)[number];

export const FREQUENCY_LABELS: Record<number, string> = {
  6: 'Cada 6 horas',
  8: 'Cada 8 horas',
  12: 'Cada 12 horas',
  24: 'Cada 24 horas',
  48: 'Cada 48 horas',
  72: 'Cada 72 horas',
};

export const DURATION_UNITS = ['días', 'semanas', 'meses'] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];
