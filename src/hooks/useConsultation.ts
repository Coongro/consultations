/**
 * Hook para obtener una consulta individual con sus medicamentos.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { Consultation, ConsultationMedication, ConsultationService } from '../types/consultation.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseConsultationResult {
  consultation: Consultation | null;
  medications: ConsultationMedication[];
  services: ConsultationService[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useConsultation(id: string | null | undefined): UseConsultationResult {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [medications, setMedications] = useState<ConsultationMedication[]>([]);
  const [services, setServices] = useState<ConsultationService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    if (!id) {
      setConsultation(null);
      setMedications([]);
      setServices([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [result, meds, svcs] = await Promise.all([
        actions.execute<Consultation | undefined>('consultations.records.getById', { id }),
        actions.execute<ConsultationMedication[]>('consultations.medications.listByConsultation', {
          consultationId: id,
        }),
        actions.execute<ConsultationService[]>('consultations.services.listByConsultation', {
          consultationId: id,
        }),
      ]);
      if (!mountedRef.current) return;
      setConsultation(result ?? null);
      setMedications(meds ?? []);
      setServices(svcs ?? []);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar consulta');
      setConsultation(null);
      setMedications([]);
      setServices([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { consultation, medications, services, loading, error, refetch: fetch };
}
