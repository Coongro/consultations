/**
 * Hook para obtener consultas de una mascota (uso principal: timeline).
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { Consultation } from '../types/consultation.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseConsultationsByPetOptions {
  petId: string | null | undefined;
  limit?: number;
  offset?: number;
}

export interface UseConsultationsByPetResult {
  consultations: Consultation[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useConsultationsByPet(
  options: UseConsultationsByPetOptions
): UseConsultationsByPetResult {
  const { petId, limit, offset } = options;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(!!petId);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    if (!petId) {
      setConsultations([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [rows, count] = await Promise.all([
        actions.execute<Consultation[]>('consultations.records.listByPet', {
          petId,
          limit,
          offset,
        }),
        actions.execute<number>('consultations.records.countByPet', { petId }),
      ]);
      if (!mountedRef.current) return;
      setConsultations(rows);
      setTotal(count);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
      setConsultations([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [petId, limit, offset]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { consultations, total, loading, error, refetch: fetch };
}
