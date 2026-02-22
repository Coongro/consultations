/**
 * @coongro/consultations — Exportaciones server-only
 *
 * Schema tables y repositories (dependen de drizzle-orm).
 * NO importar desde el browser — usar '@coongro/consultations' para hooks/componentes.
 */
export * from './schema/consultation.js';
export { ConsultationRepository } from './repositories/consultation.repository.js';
export * from './schema/consultation-medication.js';
export { ConsultationMedicationRepository } from './repositories/consultation-medication.repository.js';
export * from './schema/consultation-service.js';
export { ConsultationServiceRepository } from './repositories/consultation-service.repository.js';
