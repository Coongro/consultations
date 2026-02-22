/**
 * Hook para listar consultas con busqueda, filtros y paginacion.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { Consultation } from '../types/consultation.js';
import type { ConsultationFilters, SortDirection } from '../types/filters.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseConsultationsOptions extends ConsultationFilters {
  pageSize?: number;
  autoFetch?: boolean;
}

export interface UseConsultationsResult {
  data: Consultation[];
  loading: boolean;
  error: string | null;
  filters: ConsultationFilters;
  setFilters: (filters: ConsultationFilters) => void;
  search: (query: string) => void;
  setSort: (orderBy: string, orderDir: SortDirection) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function useConsultations(options: UseConsultationsOptions = {}): UseConsultationsResult {
  const { pageSize: initialPageSize = 20, autoFetch = true, ...initialFilters } = options;

  const [data, setData] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConsultationFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
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
      const result = await actions.execute<Consultation[]>('consultations.records.search', {
        ...filters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      if (!mountedRef.current) return;
      setData(result);
      if (result.length < pageSize) {
        setTotal((page - 1) * pageSize + result.length);
      } else {
        setTotal(Math.max(total, page * pageSize + 1));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar consultas');
      setData([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    if (autoFetch) {
      void fetch();
    }
  }, [fetch, autoFetch]);

  const search = useCallback((query: string) => {
    setFilters((prev: ConsultationFilters) => ({ ...prev, query }));
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const nextPage = useCallback(() => {
    setPage((p: number) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p: number) => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback(
    (p: number) => {
      setPage(Math.max(1, Math.min(p, totalPages)));
    },
    [totalPages]
  );

  const setSort = useCallback((orderBy: string, orderDir: SortDirection) => {
    setFilters(
      (prev: ConsultationFilters) => ({ ...prev, orderBy, orderDir }) as ConsultationFilters
    );
    setPage(1);
  }, []);

  return {
    data,
    loading,
    error,
    filters,
    setFilters: (f) => {
      setFilters(f);
      setPage(1);
    },
    search,
    setSort,
    pagination: { page, pageSize, total, totalPages },
    nextPage,
    prevPage,
    goToPage,
    refetch: fetch,
  };
}
