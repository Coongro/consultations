/**
 * Vista principal: historial de consultas con stats, filtros inline y tabla.
 * Usa DataTable de ui-components para renderizado desktop + cards en móvil.
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
const { useState, useCallback, useEffect, useRef, useMemo } = React;

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

export function ConsultationsListView() {
  const { views } = usePlugin();
  const { settings: consultSettings } = useConsultationsSettings();

  const [searchValue, setSearchValue] = useState('');
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

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      doSearch(value);
    },
    [doSearch]
  );

  const handleCategoryFilter = useCallback(
    (cat: string) => {
      setFilters({
        ...filters,
        reasonCategory: cat || undefined,
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

  const handleSort = useCallback(
    (key: string, direction: 'asc' | 'desc' | null) => {
      if (!SORTABLE_KEYS.has(key)) return;
      setSortKey(direction ? key : 'date');
      setSortDir((direction ?? 'desc') as SortDirection);
      setSort(key, direction ?? 'desc');
    },
    [setSort]
  );

  // Estado para abrir el formulario desde el empty state
  const [emptyStateCreateOpen, setEmptyStateCreateOpen] = useState(false);

  // Columnas para DataTable
  const columns = useMemo(
    () => [
      {
        key: 'date',
        header: 'Fecha',
        sortable: true,
        className: 'w-28',
        render: (c: Consultation) => formatConsultationDate(c.date),
      },
      {
        key: 'pet',
        header: 'Paciente',
        className: 'w-36',
        render: (c: Consultation) => {
          const pet = petMap.get(c.pet_id);
          const petIcon = pet ? (SPECIES_ICON[pet.species] ?? 'PawPrint') : 'PawPrint';
          const petName = pet ? pet.name : '\u2026';
          return React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement(UI.DynamicIcon, { icon: petIcon, size: 16 }),
            React.createElement('span', { className: 'font-medium' }, petName)
          );
        },
      },
      {
        key: 'vet_name',
        header: 'Veterinario',
        sortable: true,
        className: 'w-40',
        render: (c: Consultation) => c.vet_name,
      },
      {
        key: 'reason',
        header: 'Motivo / Diagnóstico',
        render: (c: Consultation) =>
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
          ),
      },
      {
        key: 'reason_category',
        header: 'Categoría',
        sortable: true,
        className: 'w-40',
        render: (c: Consultation) =>
          c.reason_category
            ? React.createElement(
                UI.Badge,
                {
                  variant: getReasonCategoryBadgeVariant(c.reason_category),
                  size: 'sm',
                },
                formatReasonCategory(c.reason_category)
              )
            : '\u2014',
      },
    ],
    [petMap]
  );

  // Filtros de categoría para DataTable
  const filterSections = useMemo(() => {
    if (!consultSettings.reasonCategoriesEnabled) return [];
    return [
      {
        label: 'Categoría',
        options: [
          { value: '', label: 'Todas' },
          ...ALL_REASON_CATEGORIES.map((cat) => ({
            value: cat,
            label: REASON_CATEGORY_LABELS[cat] ?? cat,
          })),
        ],
        value: filters.reasonCategory ?? '',
        onChange: handleCategoryFilter,
      },
    ];
  }, [consultSettings.reasonCategoriesEnabled, filters.reasonCategory, handleCategoryFilter]);

  // Slot derecho: filtros de fecha
  const dateFilterSlot = useMemo(
    () =>
      React.createElement(
        'div',
        {
          className: 'flex items-center gap-2 shrink-0 bg-cg-bg-secondary rounded-lg px-3 py-2',
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
        React.createElement('span', { className: 'text-cg-text-muted text-sm pb-2.5' }, '\u2014'),
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
      ),
    [filters.dateFrom, filters.dateTo, handleDateFrom, handleDateTo]
  );

  // Mobile render: cada consulta como card
  const mobileRender = useCallback(
    (c: Consultation) => {
      const pet = petMap.get(c.pet_id);
      const petIcon = pet ? (SPECIES_ICON[pet.species] ?? 'PawPrint') : 'PawPrint';
      const petName = pet ? pet.name : '\u2026';

      return React.createElement(
        'div',
        { className: 'flex flex-col gap-1' },
        // Fecha + categoría
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'span',
            { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
            formatConsultationDate(c.date)
          ),
          c.reason_category &&
            React.createElement(
              UI.Badge,
              {
                variant: getReasonCategoryBadgeVariant(c.reason_category),
                size: 'sm',
              },
              formatReasonCategory(c.reason_category)
            )
        ),
        // Paciente + icono
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(UI.DynamicIcon, { icon: petIcon, size: 16 }),
          React.createElement('span', { className: 'font-medium text-sm' }, petName)
        ),
        // Motivo + diagnóstico
        React.createElement('div', { className: 'text-sm text-cg-text truncate' }, c.reason),
        c.diagnosis &&
          React.createElement(
            'div',
            { className: 'text-xs truncate', style: { color: 'var(--cg-text-muted)' } },
            c.diagnosis
          ),
        // Veterinario
        React.createElement(
          'div',
          { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
          c.vet_name
        )
      );
    },
    [petMap]
  );

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

      // Stats
      React.createElement(ConsultationStats, { layout: 'row' }),

      // Contenedor con DataTable
      React.createElement(
        'div',
        { className: 'bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm' },
        React.createElement(UI.DataTable, {
          data: consultations,
          rowKey: (c: Consultation) => c.id,
          loading,
          error: error ?? undefined,
          onRetry: () => {
            void refetch();
          },
          columns,
          searchPlaceholder: 'Buscar...',
          searchValue,
          onSearchChange: handleSearch,
          filterSections,
          filterRightSlot: dateFilterSlot,
          sortKey: sortKey || null,
          sortDirection: sortDir as 'asc' | 'desc' | null,
          onSortChange: handleSort,
          pagination: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
          },
          onPageChange: goToPage,
          onRowClick: handleConsultationClick,
          emptyState: {
            title: 'Sin consultas registradas',
            description:
              'Registrá la primera consulta de un paciente para comenzar a construir su historial clínico.',
            icon: React.createElement(UI.DynamicIcon, {
              icon: 'ClipboardList',
              size: 24,
              className: 'text-cg-text-muted',
            }),
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
            filteredTitle: 'No se encontraron consultas',
            filteredDescription: 'Probá ajustando los filtros o limpiando la búsqueda.',
          },
          mobileRender,
        })
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
