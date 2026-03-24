/**
 * Vista ABM de servicios veterinarios.
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
import { createCategoryMap } from '../../utils/categories.js';
import { formatPrice } from '../../utils/price.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useMemo, useRef } = React;

type SortField = 'name' | 'price';
type SortDir = 'asc' | 'desc' | false;

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
      React.createElement(
        UI.PaginationItem,
        { key: 1 },
        React.createElement(UI.PaginationLink, {
          onClick: () => setPage(1),
          isActive: currentPage === 1,
          children: '1',
        })
      )
    );
    if (start > 2) pages.push(React.createElement(UI.PaginationEllipsis, { key: 'e1' }));
  }

  for (let i = start; i <= end; i++) {
    pages.push(
      React.createElement(
        UI.PaginationItem,
        { key: i },
        React.createElement(UI.PaginationLink, {
          onClick: () => setPage(i),
          isActive: currentPage === i,
          children: String(i),
        })
      )
    );
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push(React.createElement(UI.PaginationEllipsis, { key: 'e2' }));
    pages.push(
      React.createElement(
        UI.PaginationItem,
        { key: totalPages },
        React.createElement(UI.PaginationLink, {
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

  const [activeCatId, setActiveCatId] = useState('');

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

  // Filtrado client-side
  const allServices = useMemo(() => {
    if (!rootCategory) return [];
    return products.filter(
      (p: Product) =>
        p.category_id === rootCategory.id || serviceCategoryIds.has(p.category_id ?? '')
    );
  }, [products, rootCategory, serviceCategoryIds]);

  // Filtro de categoría server-side via setFilters
  const handleCategoryChange = useCallback(
    (catId: string) => {
      setActiveCatId(catId);
      setProductFilters({ categoryId: catId || undefined });
    },
    [setProductFilters]
  );

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(false);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField !== field) {
        setSortField(field);
        setSortDir('asc');
      } else if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortField(null);
        setSortDir(false);
      }
    },
    [sortField, sortDir]
  );

  const services = useMemo(() => {
    if (!sortField || !sortDir) return allServices;
    const sorted = [...allServices];
    sorted.sort((a: Product, b: Product) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = (parseFloat(a.sale_price ?? '0') || 0) - (parseFloat(b.sale_price ?? '0') || 0);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [allServices, sortField, sortDir]);

  // Mutaciones
  const { create, update, remove, creating, updating } = useProductMutations();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Product | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const categoryMap = useMemo(() => createCategoryMap(categories), [categories]);

  const loading = catsLoading || prodsLoading;
  const isSaving = creating || updating;
  const hasFilters = !!localSearch || !!activeCatId;

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

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
        setConfirmingDeleteId(null);
        await refetchProducts();
      }
    },
    [remove, refetchProducts]
  );

  // Valores iniciales para el dialog de edición
  const editInitialValues = useMemo(() => {
    if (!editingService) return null;
    return {
      name: editingService.name,
      description: editingService.description ?? '',
      categoryId: editingService.category_id ?? '',
      price: editingService.sale_price ?? '0',
    };
  }, [editingService]);

  function renderTableContent(): ReturnType<typeof React.createElement> {
    if (loading) {
      return React.createElement(
        UI.Table,
        { className: 'table-fixed w-full' },
        React.createElement(
          UI.TableHeader,
          null,
          React.createElement(
            UI.TableRow,
            null,
            React.createElement(UI.TableHead, { className: 'w-auto' }, 'Servicio'),
            React.createElement(
              UI.TableHead,
              { className: 'w-36 hidden sm:table-cell' },
              'Categoría'
            ),
            React.createElement(UI.TableHead, { className: 'w-28 text-right' }, 'Precio'),
            React.createElement(UI.TableHead, { className: 'w-20' }, '')
          )
        ),
        React.createElement(
          UI.TableBody,
          null,
          Array.from({ length: 5 }).map((_, i) =>
            React.createElement(
              UI.TableRow,
              { key: i },
              React.createElement(
                UI.TableCell,
                null,
                React.createElement(
                  'div',
                  { className: 'flex flex-col gap-1' },
                  React.createElement(UI.Skeleton, { className: 'h-4 w-40 rounded' }),
                  React.createElement(UI.Skeleton, { className: 'h-3 w-24 rounded' })
                )
              ),
              React.createElement(
                UI.TableCell,
                { className: 'hidden sm:table-cell' },
                React.createElement(UI.Skeleton, { className: 'h-5 w-20 rounded-full' })
              ),
              React.createElement(
                UI.TableCell,
                { className: 'text-right' },
                React.createElement(UI.Skeleton, { className: 'h-4 w-16 rounded ml-auto' })
              ),
              React.createElement(UI.TableCell, null)
            )
          )
        )
      );
    }
    if (prodsError) {
      return React.createElement(UI.ErrorDisplay, {
        title: 'Error al cargar',
        message: prodsError,
        onRetry: () => {
          void refetchProducts();
        },
        className: 'py-12',
      });
    }
    if (!rootCategory) {
      return React.createElement(UI.EmptyState, {
        title: 'Sin categorías de servicios',
        description: 'Reinicie la aplicación para ejecutar el auto-seed.',
        icon: React.createElement(UI.DynamicIcon, {
          icon: 'FolderX',
          size: 24,
          className: 'text-cg-text-muted',
        }),
        className: 'py-12',
      });
    }
    if (services.length === 0) {
      if (hasFilters) {
        return React.createElement(UI.EmptyState, {
          title: 'Sin resultados',
          description: 'No se encontraron servicios con esos filtros.',
          icon: React.createElement(UI.DynamicIcon, {
            icon: 'SearchX',
            size: 24,
            className: 'text-cg-text-muted',
          }),
          action: React.createElement(
            UI.Button,
            { variant: 'outline', size: 'sm', onClick: handleClearFilters },
            'Limpiar filtros'
          ),
          className: 'py-12',
        });
      }
      return React.createElement(UI.EmptyState, {
        title: 'Sin servicios registrados',
        description: 'Agregá tu primer servicio para comenzar a gestionarlos.',
        icon: React.createElement(UI.DynamicIcon, {
          icon: 'Stethoscope',
          size: 24,
          className: 'text-cg-text-muted',
        }),
        action: React.createElement(
          UI.Button,
          { variant: 'brand', onClick: handleCreate, className: 'gap-2' },
          React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 20 }),
          'Nuevo servicio'
        ),
        className: 'py-12',
      });
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        UI.Table,
        { className: 'table-fixed w-full' },
        React.createElement(
          UI.TableHeader,
          null,
          React.createElement(
            UI.TableRow,
            null,
            React.createElement(
              UI.TableHead,
              {
                className: 'w-auto',
                sortDirection: sortField === 'name' ? sortDir : undefined,
                onSort: () => handleSort('name'),
              },
              'Servicio'
            ),
            React.createElement(
              UI.TableHead,
              { className: 'w-36 hidden sm:table-cell' },
              'Categoría'
            ),
            React.createElement(
              UI.TableHead,
              {
                className: 'w-28 text-right',
                sortDirection: sortField === 'price' ? sortDir : undefined,
                onSort: () => handleSort('price'),
              },
              'Precio'
            ),
            React.createElement(UI.TableHead, { className: 'w-20' }, '')
          )
        ),
        React.createElement(
          UI.TableBody,
          null,
          services.map((svc: Product) => {
            const priceText = formatPrice(svc.sale_price);
            const catName = categoryMap.get(svc.category_id ?? '');

            return React.createElement(
              UI.TableRow,
              { key: svc.id, className: 'group' },

              React.createElement(
                UI.TableCell,
                { className: 'max-w-xs' },
                React.createElement(
                  'span',
                  { className: 'font-semibold text-cg-text block truncate' },
                  svc.name
                ),
                svc.description &&
                  React.createElement(
                    'p',
                    {
                      className: 'text-xs text-cg-text-muted mt-0.5 line-clamp-1',
                      title: svc.description,
                    },
                    svc.description
                  ),
                // Categoría inline en mobile
                catName &&
                  React.createElement(
                    'span',
                    { className: 'sm:hidden mt-1 inline-block' },
                    React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, catName)
                  )
              ),

              React.createElement(
                UI.TableCell,
                { className: 'hidden sm:table-cell' },
                catName
                  ? React.createElement(UI.Badge, { variant: 'secondary', size: 'sm' }, catName)
                  : React.createElement('span', { className: 'text-cg-text-muted text-sm' }, '—')
              ),

              React.createElement(
                UI.TableCell,
                { className: 'text-right' },
                React.createElement(
                  'span',
                  {
                    className:
                      priceText !== '—'
                        ? 'text-sm font-medium text-cg-text tabular-nums'
                        : 'text-sm text-cg-text-muted',
                  },
                  priceText
                )
              ),

              // Acciones — visibles en touch, hover en desktop
              React.createElement(
                UI.TableCell,
                { className: 'text-right' },
                confirmingDeleteId === svc.id
                  ? React.createElement(UI.InlineConfirm, {
                      message: '¿Eliminar?',
                      onConfirm: () => {
                        void handleDelete(svc.id);
                      },
                      onCancel: () => setConfirmingDeleteId(null),
                    })
                  : React.createElement(
                      'div',
                      {
                        className:
                          'flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity',
                      },
                      React.createElement(UI.Tooltip, {
                        content: 'Editar',
                        children: React.createElement(
                          UI.IconButton,
                          {
                            variant: 'ghost',
                            size: 'xs',
                            'aria-label': `Editar ${svc.name}`,
                            onClick: () => handleEdit(svc),
                          },
                          React.createElement(UI.DynamicIcon, { icon: 'SquarePen', size: 16 })
                        ),
                      }),
                      React.createElement(UI.Tooltip, {
                        content: 'Eliminar',
                        children: React.createElement(
                          UI.IconButton,
                          {
                            variant: 'danger',
                            size: 'xs',
                            'aria-label': `Eliminar ${svc.name}`,
                            onClick: () => setConfirmingDeleteId(svc.id),
                          },
                          React.createElement(UI.DynamicIcon, { icon: 'Trash2', size: 16 })
                        ),
                      })
                    )
              )
            );
          })
        )
      ),

      totalPages > 1 &&
        React.createElement(
          'div',
          {
            className:
              'flex items-center justify-between px-4 py-3 border-t border-cg-border-subtle',
          },
          React.createElement(
            'span',
            { className: 'text-xs text-cg-text-muted' },
            `Página ${pagination.page} de ${totalPages}`
          ),
          React.createElement(
            UI.Pagination,
            null,
            React.createElement(
              UI.PaginationContent,
              null,
              React.createElement(UI.PaginationPrevious, {
                onClick: () => pagination.setPage(pagination.page - 1),
                'aria-disabled': pagination.page <= 1,
                className: pagination.page <= 1 ? 'pointer-events-none opacity-50' : '',
              }),
              ...buildPageLinks(pagination.page, totalPages, pagination.setPage),
              React.createElement(UI.PaginationNext, {
                onClick: () => pagination.setPage(pagination.page + 1),
                'aria-disabled': pagination.page >= totalPages,
                className: pagination.page >= totalPages ? 'pointer-events-none opacity-50' : '',
              })
            )
          )
        )
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      UI.TooltipProvider,
      null,
      React.createElement(
        'div',
        { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
        React.createElement(
          'div',
          { className: 'w-full flex flex-col gap-6' },

          React.createElement(UI.PageHeader, {
            title: 'Servicios',
            subtitle:
              !loading && pagination.total > 0
                ? `${pagination.total} servicio${pagination.total === 1 ? '' : 's'} en catálogo`
                : 'Catálogo de servicios veterinarios',
            action: React.createElement(
              UI.Button,
              { onClick: handleCreate, variant: 'brand', className: 'gap-2' },
              React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 20 }),
              'Nuevo servicio'
            ),
          }),

          React.createElement(
            'div',
            {
              'aria-busy': loading,
              'aria-label': 'Tabla de servicios',
              role: 'region',
              className: 'bg-cg-bg rounded-xl border border-cg-border p-6 shadow-sm',
            },
            React.createElement(
              'div',
              { className: 'flex flex-col gap-4' },

              // Filtros inline: búsqueda izquierda + categorías derecha
              React.createElement(
                'div',
                {
                  className: 'flex flex-wrap items-end justify-between gap-4',
                  role: 'search',
                  'aria-label': 'Filtrar servicios',
                },
                React.createElement(UI.SearchInput, {
                  placeholder: 'Buscar...',
                  value: localSearch,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalSearch(e.target.value),
                  className: 'w-56 shrink-0',
                  'aria-label': 'Buscar servicios',
                }),
                React.createElement(
                  'div',
                  { className: 'flex items-end gap-3 flex-wrap' },
                  serviceCategories.length > 0 &&
                    React.createElement(
                      UI.ButtonGroup,
                      null,
                      React.createElement(
                        UI.ButtonGroupItem,
                        {
                          key: '__all',
                          active: !activeCatId,
                          onClick: () => handleCategoryChange(''),
                        },
                        'Todos'
                      ),
                      ...serviceCategories.map((cat: Category) =>
                        React.createElement(
                          UI.ButtonGroupItem,
                          {
                            key: cat.id,
                            active: activeCatId === cat.id,
                            onClick: () =>
                              handleCategoryChange(activeCatId === cat.id ? '' : cat.id),
                          },
                          cat.name
                        )
                      )
                    ),
                  hasFilters &&
                    React.createElement(
                      UI.Button,
                      { variant: 'link', size: 'xs', onClick: handleClearFilters },
                      'Limpiar filtros'
                    )
                )
              ),

              // Tabla
              renderTableContent()
            )
          )
        )
      )
    ),

    React.createElement(ServiceFormDialog, {
      open: showModal,
      onClose: handleCloseModal,
      onSave: handleSave,
      initialValues: editInitialValues,
      categories: serviceCategories,
      saving: isSaving,
    })
  );
}
