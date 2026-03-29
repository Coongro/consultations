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

// Iconos Lucide por especie (coherente con patients)
const SPECIES_ICON: Record<string, string> = {
  dog: 'Dog',
  cat: 'Cat',
  other: 'PawPrint',
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

  // Estado para abrir el formulario desde el empty state
  const [emptyStateCreateOpen, setEmptyStateCreateOpen] = useState(false);

  const COL_COUNT = 5; // Fecha, Paciente, Veterinario, Motivo+Diagnóstico, Categoría

  /** Renderiza una fila de consulta con datos de mascota resueltos */
  function renderConsultationRow(c: Consultation) {
    const pet = petMap.get(c.pet_id);
    const petIcon = pet ? (SPECIES_ICON[pet.species] ?? 'PawPrint') : 'PawPrint';
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
          React.createElement(UI.DynamicIcon, { icon: petIcon, size: 16 }),
          React.createElement('span', { className: 'font-medium' }, petName)
        )
      ),
      React.createElement(UI.TableCell, null, c.vet_name),
      // Motivo + Diagnóstico combinados
      React.createElement(
        UI.TableCell,
        null,
        React.createElement(
          'div',
          { className: 'flex flex-col gap-0.5 min-w-0' },
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-cg-text truncate block' },
            c.reason
          ),
          c.diagnosis &&
            React.createElement(
              'span',
              { className: 'text-xs text-cg-text-muted truncate block' },
              c.diagnosis
            )
        )
      ),
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
            onRetry: () => {
              void refetch();
            },
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
          hasFilters
            ? React.createElement(UI.EmptyState, {
                icon: React.createElement(UI.DynamicIcon, {
                  icon: 'SearchX',
                  size: 24,
                  className: 'text-cg-text-muted',
                }),
                title: 'No se encontraron consultas',
                description: 'Probá ajustando los filtros o limpiando la búsqueda.',
                action: React.createElement(
                  UI.Button,
                  { variant: 'outline', size: 'sm', onClick: handleClearFilters },
                  'Limpiar filtros'
                ),
              })
            : React.createElement(UI.EmptyState, {
                icon: React.createElement(UI.DynamicIcon, {
                  icon: 'ClipboardList',
                  size: 24,
                  className: 'text-cg-text-muted',
                }),
                title: 'Sin consultas registradas',
                description:
                  'Registrá la primera consulta de un paciente para comenzar a construir su historial clínico.',
                action: React.createElement(
                  UI.Button,
                  {
                    variant: 'brand',
                    onClick: () => setEmptyStateCreateOpen(true),
                    className: 'gap-2',
                  },
                  React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 18 }),
                  'Nueva consulta'
                ),
              })
        )
      );
    }

    return consultations.map(renderConsultationRow);
  }

  // La estructura completa (stats, filtros, tabla) se muestra siempre;
  // el empty state se renderiza dentro de la tabla.
  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'w-full flex flex-col gap-6' },

      React.createElement(UI.PageHeader, {
        title: 'Consultas',
        action: React.createElement(CreateConsultationButton, {
          onSuccess: handleCreateSuccess,
        }),
      }),

      // ── Stats ──
      React.createElement(ConsultationStats, { layout: 'row' }),

      // ── Contenedor tabla + filtros ──
      React.createElement(
        'div',
        { className: 'bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm' },
        React.createElement(
          'div',
          { className: 'flex flex-col gap-4' },

          // Filtros: búsqueda + categorías + fechas
          React.createElement(
            'div',
            { className: 'flex flex-wrap items-center justify-between gap-4' },

            // Izquierda: búsqueda + categorías
            React.createElement(
              'div',
              { className: 'flex items-center gap-3 min-w-0 flex-1' },

              React.createElement(UI.SearchInput, {
                placeholder: 'Buscar...',
                value: localSearch,
                onChange: handleSearchChange,
                className: 'w-56 shrink-0',
              }),
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

            // Fechas (derecha, agrupadas visualmente)
            React.createElement(
              'div',
              {
                className:
                  'flex items-center gap-2 shrink-0 bg-cg-bg-secondary rounded-lg px-3 py-2',
              },
              React.createElement(
                'div',
                { className: 'flex flex-col gap-0.5' },
                React.createElement(
                  'span',
                  { className: 'text-xs font-medium text-cg-text-muted' },
                  'Desde'
                ),
                React.createElement(UI.Input, {
                  type: 'date',
                  value: filters.dateFrom ?? '',
                  onChange: handleDateFrom,
                  className: 'w-40',
                })
              ),
              React.createElement('span', { className: 'text-cg-text-muted text-sm pb-2.5' }, '—'),
              React.createElement(
                'div',
                { className: 'flex flex-col gap-0.5' },
                React.createElement(
                  'span',
                  { className: 'text-xs font-medium text-cg-text-muted' },
                  'Hasta'
                ),
                React.createElement(UI.Input, {
                  type: 'date',
                  value: filters.dateTo ?? '',
                  onChange: handleDateTo,
                  className: 'w-40',
                })
              )
            )
          ),

          // ── Tabla ──
          React.createElement(
            UI.Table,
            { className: 'table-fixed w-full' },
            // Encabezado
            React.createElement(
              UI.TableHeader,
              null,
              React.createElement(
                UI.TableRow,
                null,
                React.createElement(
                  UI.TableHead,
                  {
                    className: 'w-28',
                    sortDirection: getSortDirection('date'),
                    onSort: () => handleSort('date'),
                  },
                  'Fecha'
                ),
                React.createElement(UI.TableHead, { className: 'w-36' }, 'Paciente'),
                React.createElement(
                  UI.TableHead,
                  {
                    className: 'w-40',
                    sortDirection: getSortDirection('vet_name'),
                    onSort: () => handleSort('vet_name'),
                  },
                  'Veterinario'
                ),
                React.createElement(UI.TableHead, null, 'Motivo / Diagnóstico'),
                React.createElement(
                  UI.TableHead,
                  {
                    className: 'w-40',
                    sortDirection: getSortDirection('reason_category'),
                    onSort: () => handleSort('reason_category'),
                  },
                  'Categoría'
                )
              )
            ),

            // Cuerpo
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
      ),

      // CreateConsultationButton controlado para el CTA del empty state
      React.createElement(CreateConsultationButton, {
        open: emptyStateCreateOpen,
        onOpenChange: setEmptyStateCreateOpen,
        onSuccess: handleCreateSuccess,
      })
    )
  );
}
