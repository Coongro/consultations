/**
 * Vista ABM de servicios veterinarios — catálogo en grilla de tarjetas.
 *
 * Reutiliza hooks de @coongro/products (useProducts, useCategories,
 * useProductMutations) y filtra por la categoría raíz de servicios
 * creada por el auto-seed.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';
import type { Product, Category, ProductCreateData } from '@coongro/products';
import { useProducts, useCategories, useProductMutations } from '@coongro/products';

import { ServiceFormDialog } from '../../components/ServiceFormDialog.js';
import type { ServiceFormValues } from '../../components/ServiceFormDialog.js';
import { ROOT_SERVICE_CATEGORY_SLUG } from '../../constants/services.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useMemo, useRef } = React;
const h = React.createElement;

type SortMode = 'cat' | 'name' | 'price-asc' | 'price-desc';

const SERIF = 'font-serif font-black tracking-tight';

// Ícono Lucide por nombre de categoría de servicio. Cubre tanto los nombres del
// diseño como los del auto-seed real (Diagnóstico, Otros servicios, Peluquería).
// Fallback a etiqueta genérica para categorías creadas a mano por el usuario.
const CAT_ICON: Record<string, string> = {
  Consultas: 'Stethoscope',
  Vacunación: 'ShieldPlus',
  Cirugías: 'Activity',
  Estética: 'Scissors',
  Peluquería: 'Scissors',
  Estudios: 'FlaskConical',
  Diagnóstico: 'FlaskConical',
  Laboratorio: 'FlaskConical',
  Internación: 'BedDouble',
  Otros: 'LayoutGrid',
  'Otros servicios': 'LayoutGrid',
};
const catIcon = (name?: string): string => (name ? (CAT_ICON[name] ?? 'Tag') : 'Tag');

/** Precio del catálogo: pesos enteros es-AR, placeholder si nulo/cero. */
function formatServicePrice(value: string | null): string {
  if (!value || value === '0') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return `$${num.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

const SORT_LABELS: Record<SortMode, string> = {
  cat: 'Por categoría',
  name: 'Nombre (A-Z)',
  'price-asc': 'Precio (menor a mayor)',
  'price-desc': 'Precio (mayor a menor)',
};

function buildPageLinks(
  currentPage: number,
  totalPages: number,
  setPage: (page: number) => void
): ReturnType<typeof React.createElement>[] {
  const pages: ReturnType<typeof React.createElement>[] = [];
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);

  if (start > 1) {
    pages.push(
      h(
        UI.PaginationItem,
        { key: 1 },
        h(UI.PaginationLink, {
          onClick: () => setPage(1),
          isActive: currentPage === 1,
          children: '1',
        })
      )
    );
    if (start > 2) pages.push(h(UI.PaginationEllipsis, { key: 'e1' }));
  }

  for (let i = start; i <= end; i++) {
    pages.push(
      h(
        UI.PaginationItem,
        { key: i },
        h(UI.PaginationLink, {
          onClick: () => setPage(i),
          isActive: currentPage === i,
          children: String(i),
        })
      )
    );
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push(h(UI.PaginationEllipsis, { key: 'e2' }));
    pages.push(
      h(
        UI.PaginationItem,
        { key: totalPages },
        h(UI.PaginationLink, {
          onClick: () => setPage(totalPages),
          isActive: currentPage === totalPages,
          children: String(totalPages),
        })
      )
    );
  }

  return pages;
}

export function ServicesView() {
  const { toast } = usePlugin();

  const { categories, loading: catsLoading } = useCategories();

  const rootCategory = useMemo(
    () => categories.find((c: Category) => c.slug === ROOT_SERVICE_CATEGORY_SLUG) ?? null,
    [categories]
  );

  const serviceCategories = useMemo(() => {
    if (!rootCategory) return [];
    return categories
      .filter((c: Category) => c.parent_id === rootCategory.id)
      .sort((a: Category, b: Category) => a.order - b.order);
  }, [categories, rootCategory]);

  const serviceCategoryIds = useMemo(
    () => new Set(serviceCategories.map((c: Category) => c.id)),
    [serviceCategories]
  );

  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const catOrderById = useMemo(() => {
    const m = new Map<string, number>();
    serviceCategories.forEach((c: Category, i: number) => m.set(c.id, c.order ?? i));
    return m;
  }, [serviceCategories]);

  const [activeCatId, setActiveCatId] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('cat');

  const {
    data: products,
    loading: prodsLoading,
    error: prodsError,
    search,
    setFilters: setProductFilters,
    pagination,
    refetch: refetchProducts,
  } = useProducts({ autoLoad: true, pageSize: 25 });

  // Búsqueda con debounce
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = UI.useDebounce(localSearch, 300);
  const prevDebouncedRef = useRef(debouncedSearch);

  useEffect(() => {
    if (prevDebouncedRef.current !== debouncedSearch) {
      prevDebouncedRef.current = debouncedSearch;
      search(debouncedSearch);
    }
  }, [debouncedSearch, search]);

  // Filtrado client-side por raíz/categorías de servicio
  const allServices = useMemo(() => {
    if (!rootCategory) return [];
    return products.filter(
      (p: Product) =>
        p.category_id === rootCategory.id || serviceCategoryIds.has(p.category_id ?? '')
    );
  }, [products, rootCategory, serviceCategoryIds]);

  const handleCategoryChange = useCallback(
    (catId: string) => {
      setActiveCatId(catId);
      setProductFilters({ categoryId: catId || undefined });
    },
    [setProductFilters]
  );

  // Ordenamiento client-side
  const services = useMemo(() => {
    const list = [...allServices];
    const priceOf = (p: Product) => parseFloat(p.sale_price ?? '0') || 0;
    list.sort((a: Product, b: Product) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name, 'es');
      if (sortMode === 'price-asc') return priceOf(a) - priceOf(b);
      if (sortMode === 'price-desc') return priceOf(b) - priceOf(a);
      // 'cat': por orden de categoría y luego nombre
      const ca = catOrderById.get(a.category_id ?? '') ?? 99;
      const cb = catOrderById.get(b.category_id ?? '') ?? 99;
      return ca - cb || a.name.localeCompare(b.name, 'es');
    });
    return list;
  }, [allServices, sortMode, catOrderById]);

  // Mutaciones
  const { create, update, remove, creating, updating, deleting } = useProductMutations();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Product | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Product | null>(null);

  const loading = catsLoading || prodsLoading;
  const isSaving = creating || updating;
  const hasFilters = !!localSearch || !!activeCatId;
  const total = pagination.total;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  const isEmptyCatalog = !loading && !prodsError && !!rootCategory && total === 0 && !hasFilters;
  const isNoResults =
    !loading && !prodsError && !!rootCategory && services.length === 0 && hasFilters;

  // Handlers
  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    search('');
    handleCategoryChange('');
  }, [search, handleCategoryChange]);

  const handleCreate = useCallback(() => {
    setEditingService(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((service: Product) => {
    setEditingService(service);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingService(null);
  }, []);

  const handleSave = useCallback(
    async (values: ServiceFormValues): Promise<boolean> => {
      try {
        if (editingService) {
          const result = await update(editingService.id, {
            name: values.name.trim(),
            description: values.description.trim() || null,
            category_id: values.categoryId || null,
            sale_price: values.price || '0',
          });
          if (result) {
            await refetchProducts();
            return true;
          }
        } else {
          const data: ProductCreateData = {
            name: values.name.trim(),
            description: values.description.trim() || null,
            category_id: values.categoryId || null,
            sale_price: values.price || '0',
            stock_current: '0',
            stock_minimum: '0',
            metadata: { type: 'service' },
          };
          const result = await create(data);
          if (result) {
            await refetchProducts();
            return true;
          }
        }
      } catch {
        toast.error(
          'Error',
          'No se pudo guardar el servicio. Verificá tu conexión e intentá de nuevo.'
        );
      }
      return false;
    },
    [editingService, create, update, toast, refetchProducts]
  );

  const handleDelete = useCallback(
    async (serviceId: string) => {
      const ok = await remove(serviceId);
      if (ok) {
        setConfirmingDelete(null);
        await refetchProducts();
      }
    },
    [remove, refetchProducts]
  );

  const editInitialValues = useMemo(() => {
    if (!editingService) return null;
    return {
      name: editingService.name,
      description: editingService.description ?? '',
      categoryId: editingService.category_id ?? '',
      price: editingService.sale_price ?? '0',
    };
  }, [editingService]);

  // ── Tarjeta de servicio ──
  function serviceCard(svc: Product) {
    const catName = catNameById.get(svc.category_id ?? '');
    return h(
      'div',
      {
        key: svc.id,
        role: 'button',
        tabIndex: 0,
        onClick: () => handleEdit(svc),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') handleEdit(svc);
        },
        className:
          'group relative flex flex-col rounded-xl border border-cg-border bg-cg-surface px-5 pt-[18px] pb-5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5',
      },
      // Acción eliminar (hover/focus)
      h(
        'div',
        {
          className:
            'absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity',
        },
        h(
          'button',
          {
            'aria-label': `Eliminar ${svc.name}`,
            title: 'Eliminar',
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              setConfirmingDelete(svc);
            },
            className:
              'w-[30px] h-[30px] rounded-md inline-flex items-center justify-center border border-cg-border bg-cg-surface text-cg-text-secondary transition-colors hover:bg-cg-red-soft hover:text-cg-red-dk hover:border-cg-red-lt',
          },
          h(UI.DynamicIcon, { icon: 'Trash2', size: 14 })
        )
      ),
      // Top: ícono de categoría + etiqueta
      h(
        'div',
        { className: 'flex items-center gap-2.5 mb-3.5' },
        h(
          'span',
          {
            className:
              'w-[38px] h-[38px] rounded-lg flex-shrink-0 inline-flex items-center justify-center bg-cg-bg-hover text-cg-text-secondary transition-colors group-hover:bg-cg-gold-soft group-hover:text-cg-gold-deep',
          },
          h(UI.DynamicIcon, { icon: catIcon(catName), size: 18 })
        ),
        h(
          'span',
          {
            className:
              'text-[11px] font-bold uppercase tracking-[0.06em] text-cg-text-muted truncate',
          },
          catName ?? 'Sin categoría'
        )
      ),
      // Nombre
      h('h3', { className: `${SERIF} text-[19px] leading-tight m-0 text-cg-text` }, svc.name),
      // Descripción
      h(
        'p',
        {
          className: 'text-[13px] leading-normal text-cg-text-secondary mt-2 line-clamp-2',
          style: { minHeight: 39 },
          title: svc.description ?? undefined,
        },
        svc.description || 'Sin descripción.'
      ),
      h('div', { className: 'flex-1', style: { minHeight: 12 } }),
      // Footer: precio
      h(
        'div',
        { className: 'flex items-center gap-2 mt-4 pt-3.5 border-t border-cg-border-subtle' },
        h(UI.DynamicIcon, { icon: 'Tag', size: 14, className: 'text-cg-gold-deep flex-shrink-0' }),
        h(
          'span',
          {
            className: 'text-[22px] font-semibold tracking-tight text-cg-text',
            style: { fontVariantNumeric: 'tabular-nums' },
          },
          formatServicePrice(svc.sale_price)
        )
      )
    );
  }

  // ── Empties con estilo de tarjeta ──
  function emptyCard(opts: {
    icon: string;
    title: string;
    desc: string;
    action: ReturnType<typeof React.createElement>;
  }) {
    return h(
      'div',
      {
        className:
          'flex flex-col items-center text-center rounded-xl border border-cg-border bg-cg-surface px-8 py-[72px]',
      },
      h(
        'span',
        {
          className:
            'w-[60px] h-[60px] rounded-[15px] mb-5 inline-flex items-center justify-center bg-cg-bg-hover text-cg-text-secondary',
        },
        h(UI.DynamicIcon, { icon: opts.icon, size: 26 })
      ),
      h(
        'h2',
        { className: `${SERIF} text-[22px] m-0 mb-2.5 text-cg-text max-w-[440px]` },
        opts.title
      ),
      h(
        'p',
        {
          className:
            'text-[13.5px] leading-relaxed text-cg-text-secondary m-0 mb-[22px] max-w-[420px]',
        },
        opts.desc
      ),
      opts.action
    );
  }

  // ── Skeleton (grilla) ──
  function skeletonGrid() {
    return h(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 16,
        },
      },
      ...Array.from({ length: 6 }).map((_, i) =>
        h(
          'div',
          {
            key: i,
            className: 'rounded-xl border border-cg-border bg-cg-surface px-5 pt-[18px] pb-5',
          },
          h(
            'div',
            { className: 'flex items-center gap-2.5 mb-3.5' },
            h(UI.Skeleton, { className: 'w-[38px] h-[38px] rounded-lg' }),
            h(UI.Skeleton, { className: 'h-3 w-20 rounded' })
          ),
          h(UI.Skeleton, { className: 'h-5 w-40 rounded mb-2' }),
          h(UI.Skeleton, { className: 'h-3 w-full rounded mb-1' }),
          h(UI.Skeleton, { className: 'h-3 w-2/3 rounded' }),
          h(UI.Skeleton, { className: 'h-6 w-24 rounded mt-5' })
        )
      )
    );
  }

  // ── Contenido principal (grilla / empties / error) ──
  function renderContent(): ReturnType<typeof React.createElement> {
    if (loading) return skeletonGrid();
    if (prodsError) {
      return h(UI.ErrorDisplay, {
        title: 'Error al cargar',
        message: prodsError,
        onRetry: () => void refetchProducts(),
        className: 'py-12',
      });
    }
    if (!rootCategory) {
      return emptyCard({
        icon: 'FolderX',
        title: 'Sin categorías de servicios',
        desc: 'Reiniciá la aplicación para ejecutar el auto-seed de categorías.',
        action: h('span', null),
      });
    }
    if (isEmptyCatalog) {
      return emptyCard({
        icon: 'ReceiptText',
        title: 'Todavía no cargaste ningún servicio',
        desc: 'Armá tu lista de referencia: consultas, vacunas, cirugías, peluquería. Después los elegís al facturar o al cargar una consulta.',
        action: h(
          UI.Button,
          { variant: 'brand', size: 'lg', onClick: handleCreate, className: 'gap-2' },
          h(UI.DynamicIcon, { icon: 'Plus', size: 16 }),
          'Crear tu primer servicio'
        ),
      });
    }
    if (isNoResults) {
      return emptyCard({
        icon: 'SearchX',
        title: 'No encontramos servicios',
        desc: 'No hay servicios que coincidan con tu búsqueda o filtro. Probá con otro término o limpiá los filtros.',
        action: h(
          UI.Button,
          { variant: 'outline', onClick: handleClearFilters },
          'Limpiar búsqueda y filtros'
        ),
      });
    }

    return h(
      React.Fragment,
      null,
      h(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: 16,
          },
        },
        ...services.map((svc: Product) => serviceCard(svc))
      ),
      totalPages > 1 &&
        h(
          'div',
          { className: 'flex items-center justify-between mt-6' },
          h(
            'span',
            { className: 'text-xs text-cg-text-muted' },
            `Página ${pagination.page} de ${totalPages}`
          ),
          h(
            UI.Pagination,
            null,
            h(
              UI.PaginationContent,
              null,
              h(UI.PaginationPrevious, {
                onClick: () => pagination.setPage(pagination.page - 1),
                'aria-disabled': pagination.page <= 1,
                className: pagination.page <= 1 ? 'pointer-events-none opacity-50' : '',
              }),
              ...buildPageLinks(pagination.page, totalPages, pagination.setPage),
              h(UI.PaginationNext, {
                onClick: () => pagination.setPage(pagination.page + 1),
                'aria-disabled': pagination.page >= totalPages,
                className: pagination.page >= totalPages ? 'pointer-events-none opacity-50' : '',
              })
            )
          )
        )
    );
  }

  // ── Chips de categoría ──
  const chip = (active: boolean, icon: string, label: string, onClick: () => void) =>
    h(
      'button',
      {
        onClick,
        className: `inline-flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12.5px] whitespace-nowrap border transition-colors ${
          active
            ? 'bg-cg-gold border-cg-gold text-cg-neutral-950 font-semibold'
            : 'bg-cg-surface border-cg-border text-cg-text-secondary font-medium hover:bg-cg-bg-hover'
        }`,
      },
      h(UI.DynamicIcon, { icon, size: 13, className: active ? '' : 'opacity-60' }),
      label
    );

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'min-h-screen bg-cg-bg-secondary p-6' },
      h(
        'div',
        { className: 'max-w-[1200px] mx-auto flex flex-col' },

        // ── Encabezado ──
        h(
          'div',
          { className: 'flex items-end justify-between gap-6 flex-wrap mb-6' },
          h(
            'div',
            { className: 'flex flex-col max-w-[560px]' },
            h(
              'span',
              {
                className:
                  'text-[11px] font-bold uppercase tracking-[0.1em] text-cg-gold-deep mb-1.5',
              },
              'Catálogo'
            ),
            h(
              'h1',
              { className: `${SERIF} text-[28px] leading-none m-0 text-cg-text` },
              'Servicios y precios'
            ),
            h(
              'p',
              { className: 'text-sm text-cg-text-secondary mt-2 leading-normal' },
              'Tu lista de referencia de servicios y lo que cobrás por cada uno. La usás al facturar o al cargar una consulta.'
            )
          ),
          !isEmptyCatalog &&
            h(
              UI.Button,
              { variant: 'brand', size: 'lg', onClick: handleCreate, className: 'gap-2' },
              h(UI.DynamicIcon, { icon: 'Plus', size: 16 }),
              'Agregar servicio'
            )
        ),

        // ── Toolbar + chips + conteo (oculto en onboarding) ──
        !isEmptyCatalog &&
          !prodsError &&
          !!rootCategory &&
          h(
            React.Fragment,
            null,
            // Búsqueda + orden
            h(
              'div',
              { className: 'flex items-center gap-3 flex-wrap mb-4' },
              h(UI.SearchInput, {
                placeholder: 'Buscar servicio por nombre',
                value: localSearch,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocalSearch(e.target.value),
                className: 'w-[320px] max-w-full',
                'aria-label': 'Buscar servicios',
              }),
              h('span', { className: 'flex-1' }),
              h(
                'div',
                { className: 'w-[210px]' },
                h(
                  UI.Select,
                  {
                    value: sortMode,
                    onValueChange: (v: string) => setSortMode(v as SortMode),
                  },
                  (Object.keys(SORT_LABELS) as SortMode[]).map((k) =>
                    h(UI.SelectItem, { key: k, value: k }, SORT_LABELS[k])
                  )
                )
              )
            ),
            // Chips de categoría
            serviceCategories.length > 0 &&
              h(
                'div',
                { className: 'flex items-center gap-[7px] flex-wrap mb-5' },
                chip(!activeCatId, 'Layers', 'Todas', () => handleCategoryChange('')),
                ...serviceCategories.map((c: Category) =>
                  chip(activeCatId === c.id, catIcon(c.name), c.name, () =>
                    handleCategoryChange(activeCatId === c.id ? '' : c.id)
                  )
                )
              ),
            // Conteo
            h(
              'div',
              { className: 'mb-3.5 text-[12.5px] text-cg-text-secondary' },
              h('strong', { className: 'text-cg-text font-semibold' }, String(total)),
              hasFilters
                ? ` resultado${total === 1 ? '' : 's'}`
                : ` servicio${total === 1 ? '' : 's'} en total`
            )
          ),

        // ── Contenido ──
        renderContent()
      )
    ),

    h(ServiceFormDialog, {
      open: showModal,
      onClose: handleCloseModal,
      onSave: handleSave,
      initialValues: editInitialValues,
      categories: serviceCategories,
      saving: isSaving,
    }),

    h(UI.ConfirmDialog, {
      open: confirmingDelete !== null,
      onOpenChange: (val: boolean) => !val && setConfirmingDelete(null),
      title: 'Eliminar servicio',
      description: confirmingDelete
        ? h(
            React.Fragment,
            null,
            'Vas a eliminar ',
            h('strong', { className: 'text-cg-text' }, confirmingDelete.name),
            ' del catálogo. Esta acción no se puede deshacer.'
          )
        : '',
      confirmLabel: 'Eliminar',
      loadingLabel: 'Eliminando...',
      loading: deleting,
      onConfirm: () => confirmingDelete && void handleDelete(confirmingDelete.id),
    } as never)
  );
}
