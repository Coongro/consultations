/**
 * Hook para obtener estadísticas de consultas.
 */
import { useTenantTimezone } from '@coongro/calendar';
import { getHostReact, actions } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface ConsultationStatsData {
  total: number;
  byCategory: Array<{ label: string; count: number }>;
  pendingFollowUps: number;
}

export function useConsultationStats(): {
  stats: ConsultationStatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const tz = useTenantTimezone();
  const [stats, setStats] = useState<ConsultationStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [byCategory, total, pendingFollowUps] = await Promise.all([
        actions.execute<Array<{ label: string; count: number }>>(
          'consultations.records.countByReasonCategory'
        ),
        actions.execute<number>('consultations.records.countTotal'),
        actions.execute<number>('consultations.records.countPendingFollowUps', { tz }),
      ]);

      if (!mountedRef.current) return;

      setStats({ total, byCategory, pendingFollowUps });
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [tz]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
