/**
 * Vista principal: historial de consultas con stats, filtros inline y tabla.
 */
import { getHostReact, getHostUI, usePlugin, actions } from '@coongro/plugin-sdk';

import { ConsultationStats } from '../../components/ConsultationStats.js';
import { CreateConsultationButton } from '../../components/CreateConsultationButton.js';
import { useConsultations } from '../../hooks/useConsultations.js';
import { useConsultationsSettings } from '../../hooks/useConsultationsSettings.js';
import type { Consultation } from '../../types/consultation.js';
import type { SortDirection } from '../../types/filters.js';
import {
  ALL_REASON_CATEGORIES,
  REASON_CATEGORY_LABELS,
  formatConsultationDate,
  formatReasonCategory,
  getReasonCategoryBadgeVariant,
} from '../../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useRef } = React;

// Emojis por especie (mismo map que patients)
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  other: '🐾',
};

interface PetInfo {
  name: string;
  species: string;
}

const SORTABLE_KEYS = new Set(['date', 'vet_name', 'reason_category']);

/** Genera lista de números de página con elipsis */
function buildPageNumbers(current: number, total: number): Array<number | '...'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | '...'> = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export function ConsultationsListView() {
  const { views } = usePlugin();
  const { settings: consultSettings } = useConsultationsSettings();

  const [localSearch, setLocalSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Cache de nombres de mascotas
  const petCacheRef = useRef<Map<string, PetInfo>>(new Map());
  const [petMap, setPetMap] = useState<Map<string, PetInfo>>(new Map());

  const {
    data: consultations,
    loading,
    error,
    filters,
    setFilters,
    search: doSearch,
    setSort,
    pagination,
    nextPage,
    prevPage,
    goToPage,
    refetch,
  } = useConsultations({ pageSize: 20 });

  // Resolver nombres de mascotas a partir de los pet_id de las consultas
  useEffect(() => {
    if (!consultations.length) return;

    const unknownIds = [
      ...new Set(consultations.map((c) => c.pet_id).filter((id) => !petCacheRef.current.has(id))),
    ];

    if (unknownIds.length === 0) {
      // Todos ya conocidos, refrescar el state
      setPetMap(new Map(petCacheRef.current));
      return;
    }

    let cancelled = false;
    void (async () => {
      const results = await Promise.allSettled(
        unknownIds.map((id) =>
          actions.execute<{ id: string; name: string; species: string } | undefined>(
            'patients.pets.getById',
            { id }
          )
        )
      );
      if (cancelled) return;
      for (let i = 0; i < unknownIds.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value) {
          petCacheRef.current.set(unknownIds[i], {
            name: r.value.name,
            species: r.value.species,
          });
        }
      }
      setPetMap(new Map(petCacheRef.current));
    })();

    return () => {
      cancelled = true;
    };
  }, [consultations]);

  const handleConsultationClick = useCallback(
    (c: Consultation) => {
      views.open('consultations.detail.open', { consultationId: c.id });
    },
    [views]
  );

  const handleCreateSuccess = useCallback(
    (c: Consultation) => {
      views.open('consultations.detail.open', { consultationId: c.id });
    },
    [views]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalSearch(val);
      doSearch(val);
    },
    [doSearch]
  );

  const handleCategoryFilter = useCallback(
    (cat: string) => {
      setFilters({
        ...filters,
        reasonCategory: filters.reasonCategory === cat ? undefined : cat,
      });
    },
    [filters, setFilters]
  );

  const handleDateFrom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, dateFrom: e.target.value || undefined });
    },
    [filters, setFilters]
  );

  const handleDateTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, dateTo: e.target.value || undefined });
    },
    [filters, setFilters]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setLocalSearch('');
    doSearch('');
  }, [setFilters, doSearch]);

  const handleSort = useCallback(
    (key: string) => {
      if (!SORTABLE_KEYS.has(key)) return;
      const newDir: SortDirection = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
      setSortKey(key);
      setSortDir(newDir);
      setSort(key, newDir);
    },
    [sortKey, sortDir, setSort]
  );

  function getSortDirection(colKey: string): 'asc' | 'desc' | false | undefined {
    if (!SORTABLE_KEYS.has(colKey)) return undefined;
    return sortKey === colKey ? (sortDir as 'asc' | 'desc') : false;
  }

  const hasFilters = localSearch || filters.reasonCategory || filters.dateFrom || filters.dateTo;

  const COL_COUNT = 7; // Fecha, Paciente, Veterinario, Motivo, Categoria, Diagnostico, Acciones

  /** Renderiza una fila de consulta con datos de mascota resueltos */
  function renderConsultationRow(c: Consultation) {
    const pet = petMap.get(c.pet_id);
    const petEmoji = pet ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
    const petName = pet ? pet.name : '…';

    return React.createElement(
      UI.TableRow,
      {
        key: c.id,
        onClick: () => handleConsultationClick(c),
        className: 'cursor-pointer',
      },
      React.createElement(
        UI.TableCell,
        { className: 'whitespace-nowrap' },
        formatConsultationDate(c.date)
      ),
      React.createElement(
        UI.TableCell,
        null,
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement('span', null, petEmoji),
          React.createElement('span', { className: 'font-medium' }, petName)
        )
      ),
      React.createElement(UI.TableCell, null, c.vet_name),
      React.createElement(UI.TableCell, { className: 'max-w-[200px] truncate' }, c.reason),
      React.createElement(
        UI.TableCell,
        null,
        c.reason_category
          ? React.createElement(
              UI.Badge,
              {
                variant: getReasonCategoryBadgeVariant(c.reason_category),
                size: 'sm',
              },
              formatReasonCategory(c.reason_category)
            )
          : '—'
      ),
      React.createElement(
        UI.TableCell,
        { className: 'max-w-[200px] truncate' },
        c.diagnosis ?? '—'
      ),
      React.createElement(
        UI.TableCell,
        {
          className: 'text-right',
          onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
        },
        React.createElement(
          UI.Button,
          {
            variant: 'ghost',
            size: 'xs',
            onClick: () => handleConsultationClick(c),
          },
          'Ver'
        )
      )
    );
  }

  /** Contenido del cuerpo de la tabla segun el estado actual */
  function renderTableBodyContent(): React.ReactNode {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) =>
        React.createElement(
          UI.TableRow,
          { key: `sk-${i}` },
          Array.from({ length: COL_COUNT }).map((_, j) =>
            React.createElement(
              UI.TableCell,
              { key: j },
              React.createElement(UI.Skeleton, { className: 'h-4' })
            )
          )
        )
      );
    }

    if (error) {
      return React.createElement(
        UI.TableRow,
        null,
        React.createElement(
          UI.TableCell,
          { colSpan: COL_COUNT, className: 'p-0' },
          React.createElement(UI.ErrorDisplay, {
            title: 'Error al cargar',
            message: error,
            onRetry: refetch,
          })
        )
      );
    }

    if (consultations.length === 0) {
      return React.createElement(
        UI.TableRow,
        null,
        React.createElement(
          UI.TableCell,
          { colSpan: COL_COUNT, className: 'p-0' },
          React.createElement(UI.EmptyState, {
            title: hasFilters
              ? 'No se encontraron consultas con esos filtros'
              : 'Sin consultas registradas',
          })
        )
      );
    }

    return consultations.map(renderConsultationRow);
  }

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'max-w-6xl mx-auto flex flex-col gap-6' },

      // ── Header ──
      React.createElement(
        'div',
        { className: 'flex items-center justify-between' },
        React.createElement(
          'div',
          null,
          React.createElement('h1', { className: 'text-2xl font-bold text-cg-text' }, 'Consultas'),
          React.createElement(
            'p',
            { className: 'text-sm text-cg-text-muted mt-1' },
            'Historial de consultas veterinarias'
          )
        ),
        React.createElement(CreateConsultationButton, {
          onSuccess: handleCreateSuccess,
        })
      ),

      // ── Stats ──
      React.createElement(ConsultationStats, { layout: 'row' }),

      // ── Contenedor tabla + filtros ──
      React.createElement(
        'div',
        { className: 'bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm' },
        React.createElement(
          'div',
          { className: 'flex flex-col gap-4' },

          // Búsqueda con icono
          React.createElement(
            'div',
            { className: 'relative flex-1' },
            React.createElement(UI.DynamicIcon, {
              icon: 'Search',
              size: 16,
              className: 'absolute left-3 top-1/2 -translate-y-1/2 text-cg-text-muted',
            }),
            React.createElement(UI.Input, {
              type: 'text',
              placeholder: 'Buscar por motivo, veterinario, diagnóstico...',
              value: localSearch,
              onChange: handleSearchChange,
              className: 'pl-10',
            })
          ),

          // Filtros: categorías + fechas
          React.createElement(
            'div',
            { className: 'flex items-center gap-4 flex-wrap' },

            // Categorías rápidas
            consultSettings.reasonCategoriesEnabled &&
              React.createElement(UI.ButtonGroup, null, [
                React.createElement(
                  UI.ButtonGroupItem,
                  {
                    key: '__all',
                    active: !filters.reasonCategory,
                    onClick: () => setFilters({ ...filters, reasonCategory: undefined }),
                  },
                  'Todas'
                ),
                ...ALL_REASON_CATEGORIES.map((cat) =>
                  React.createElement(
                    UI.ButtonGroupItem,
                    {
                      key: cat,
                      active: filters.reasonCategory === cat,
                      onClick: () => handleCategoryFilter(cat),
                    },
                    REASON_CATEGORY_LABELS[cat] ?? cat
                  )
                ),
              ]),

            // Fechas
            React.createElement(
              'div',
              { className: 'flex items-center gap-2 ml-auto' },
              React.createElement(UI.Input, {
                type: 'date',
                value: filters.dateFrom ?? '',
                onChange: handleDateFrom,
                title: 'Desde',
                className: 'w-36',
              }),
              React.createElement('span', { className: 'text-cg-text-muted text-sm' }, '—'),
              React.createElement(UI.Input, {
                type: 'date',
                value: filters.dateTo ?? '',
                onChange: handleDateTo,
                title: 'Hasta',
                className: 'w-36',
              })
            ),

            // Limpiar filtros
            hasFilters &&
              React.createElement(
                UI.Button,
                {
                  variant: 'link',
                  size: 'xs',
                  onClick: handleClearFilters,
                },
                'Limpiar filtros'
              )
          ),

          // ── Tabla ──
          React.createElement(
            UI.Table,
            null,
            // Header
            React.createElement(
              UI.TableHeader,
              null,
              React.createElement(
                UI.TableRow,
                null,
                React.createElement(
                  UI.TableHead,
                  { sortDirection: getSortDirection('date'), onSort: () => handleSort('date') },
                  'Fecha'
                ),
                React.createElement(UI.TableHead, null, 'Paciente'),
                React.createElement(
                  UI.TableHead,
                  {
                    sortDirection: getSortDirection('vet_name'),
                    onSort: () => handleSort('vet_name'),
                  },
                  'Veterinario'
                ),
                React.createElement(UI.TableHead, null, 'Motivo'),
                React.createElement(
                  UI.TableHead,
                  {
                    sortDirection: getSortDirection('reason_category'),
                    onSort: () => handleSort('reason_category'),
                  },
                  'Categoría'
                ),
                React.createElement(UI.TableHead, null, 'Diagnóstico'),
                React.createElement(UI.TableHead, { className: 'w-20 text-right' }, 'Acciones')
              )
            ),

            // Body
            React.createElement(UI.TableBody, null, renderTableBodyContent())
          ),

          // ── Paginación ──
          !loading &&
            consultations.length > 0 &&
            React.createElement(
              'div',
              {
                className: 'flex items-center justify-between text-sm text-cg-text-muted pt-2',
              },
              React.createElement(
                'span',
                null,
                `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} de ${pagination.total}`
              ),
              React.createElement(
                UI.Pagination,
                null,
                React.createElement(
                  UI.PaginationContent,
                  null,
                  React.createElement(
                    UI.PaginationItem,
                    null,
                    React.createElement(UI.PaginationPrevious, {
                      onClick: prevPage,
                      disabled: pagination.page <= 1,
                    })
                  ),
                  ...buildPageNumbers(pagination.page, pagination.totalPages).map((item, i) =>
                    React.createElement(
                      UI.PaginationItem,
                      { key: i },
                      item === '...'
                        ? React.createElement(UI.PaginationEllipsis)
                        : React.createElement(
                            UI.PaginationLink,
                            {
                              isActive: item === pagination.page,
                              onClick: () => goToPage(item),
                            },
                            item
                          )
                    )
                  ),
                  React.createElement(
                    UI.PaginationItem,
                    null,
                    React.createElement(UI.PaginationNext, {
                      onClick: nextPage,
                      disabled: pagination.page >= pagination.totalPages,
                    })
                  )
                )
              )
            )
        )
      )
    )
  );
}
