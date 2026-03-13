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

import { ROOT_SERVICE_CATEGORY_SLUG } from '../../constants/services.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useMemo } = React;

interface ServiceFormData {
  name: string;
  description: string;
  categoryId: string;
  price: string;
}

const EMPTY_FORM: ServiceFormData = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
};

type SortField = 'name' | 'price';
type SortDir = 'asc' | 'desc' | false;

function formatPrice(value: string | null): string {
  if (!value || value === '0') return '';
  const num = parseFloat(value);
  return isNaN(num) ? '' : `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

export function ServicesView() {
  const { toast } = usePlugin();

  // --- Categorías ---
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

  // --- Filtro de subcategoría ---
  const [activeCatId, setActiveCatId] = useState<string | undefined>(undefined);

  // --- Productos (servicios) ---
  const {
    data: products,
    loading: prodsLoading,
    error: prodsError,
    search,
    refetch: refetchProducts,
    setFilters,
  } = useProducts({
    autoLoad: true,
    pageSize: 50,
  });

  useEffect(() => {
    if (!rootCategory) return;
    setFilters({ categoryId: activeCatId });
  }, [rootCategory, activeCatId, setFilters]);

  const filteredServices = useMemo(() => {
    if (!rootCategory) return [];
    return products.filter(
      (p: Product) =>
        p.category_id === rootCategory.id || serviceCategoryIds.has(p.category_id ?? '')
    );
  }, [products, rootCategory, serviceCategoryIds]);

  // --- Sorting local ---
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
    if (!sortField || !sortDir) return filteredServices;
    const sorted = [...filteredServices];
    sorted.sort((a: Product, b: Product) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'price') {
        cmp = (parseFloat(a.sale_price ?? '0') || 0) - (parseFloat(b.sale_price ?? '0') || 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredServices, sortField, sortDir]);

  // --- Mutaciones ---
  const { create, update, remove, creating, updating } = useProductMutations();

  // --- Modal ---
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Product | null>(null);
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);

  const [localSearch, setLocalSearch] = useState('');

  // --- Confirmación inline para eliminar ---
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // --- Búsqueda ---
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalSearch(val);
      search(val);
    },
    [search]
  );

  // --- Filtro por categoría via tabs ---
  const handleTabChange = useCallback((val: string) => {
    setActiveCatId(val === 'all' ? undefined : val);
  }, []);

  // --- Abrir modal para crear ---
  const handleCreate = useCallback(() => {
    setEditingService(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: serviceCategories.length > 0 ? serviceCategories[0].id : '',
    });
    setShowModal(true);
  }, [serviceCategories]);

  // --- Abrir modal para editar ---
  const handleEdit = useCallback((service: Product) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? '',
      categoryId: service.category_id ?? '',
      price: service.sale_price ?? '0',
    });
    setShowModal(true);
  }, []);

  // --- Cerrar modal ---
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  }, []);

  // --- Submit ---
  const handleSubmit = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error('Error', 'El nombre del servicio es obligatorio');
      return;
    }

    if (editingService) {
      const result = await update(editingService.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.categoryId || null,
        sale_price: form.price || '0',
      });
      if (result) {
        handleCloseModal();
        await refetchProducts();
      }
    } else {
      const data: ProductCreateData = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.categoryId || null,
        sale_price: form.price || '0',
        stock_current: '0',
        stock_minimum: '0',
        metadata: { type: 'service' },
      };
      const result = await create(data);
      if (result) {
        handleCloseModal();
        await refetchProducts();
      }
    }
  }, [form, editingService, create, update, toast, handleCloseModal, refetchProducts]);

  // --- Eliminar ---
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

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const loading = catsLoading || prodsLoading;
  const isSaving = creating || updating;

  let submitLabel = 'Crear servicio';
  if (isSaving) submitLabel = 'Guardando...';
  else if (editingService) submitLabel = 'Guardar cambios';

  // Contenido de la tabla (loading / error / vacío / filas)
  function renderTableContent(): ReturnType<typeof React.createElement> {
    if (loading) {
      return React.createElement(UI.LoadingOverlay, {
        variant: 'skeleton',
        rows: 5,
        className: 'p-6',
      });
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
      // Estado vacío con filtros activos
      if (localSearch || activeCatId) {
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
            {
              variant: 'outline',
              size: 'sm',
              onClick: () => {
                setLocalSearch('');
                search('');
                setActiveCatId(undefined);
              },
            },
            'Limpiar filtros'
          ),
          className: 'py-12',
        });
      }
      // Estado vacío sin filtros
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
          { size: 'sm', onClick: handleCreate },
          React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 14 }),
          'Nuevo servicio'
        ),
        className: 'py-12',
      });
    }

    return React.createElement(
      UI.Table,
      null,
      React.createElement(
        UI.TableHeader,
        null,
        React.createElement(
          UI.TableRow,
          null,
          React.createElement(
            UI.TableHead,
            {
              sortDirection: sortField === 'name' ? sortDir : undefined,
              onSort: () => handleSort('name'),
            },
            'Servicio'
          ),
          React.createElement(UI.TableHead, null, 'Categoría'),
          React.createElement(
            UI.TableHead,
            {
              className: 'text-right',
              sortDirection: sortField === 'price' ? sortDir : undefined,
              onSort: () => handleSort('price'),
            },
            'Precio'
          ),
          React.createElement(UI.TableHead, { className: 'w-24' }, '')
        )
      ),
      React.createElement(
        UI.TableBody,
        null,
        services.map((svc: Product) => {
          const priceFormatted = formatPrice(svc.sale_price);

          return React.createElement(
            UI.TableRow,
            { key: svc.id, className: 'group' },

            // Nombre + descripción
            React.createElement(
              UI.TableCell,
              null,
              React.createElement('div', { className: 'font-medium text-cg-text' }, svc.name),
              svc.description &&
                React.createElement(
                  'div',
                  { className: 'text-xs text-cg-text-muted mt-0.5 line-clamp-1' },
                  svc.description
                )
            ),

            // Categoría
            React.createElement(
              UI.TableCell,
              { className: 'text-cg-text-muted' },
              categoryMap.get(svc.category_id ?? '') ?? '-'
            ),

            // Precio
            React.createElement(
              UI.TableCell,
              { className: 'text-right' },
              priceFormatted
                ? React.createElement(
                    UI.Badge,
                    { variant: 'brand-soft', size: 'sm' },
                    priceFormatted
                  )
                : React.createElement('span', { className: 'text-sm text-cg-text-muted' }, '—')
            ),

            // Acciones
            React.createElement(
              UI.TableCell,
              { className: 'text-right' },
              confirmingDeleteId === svc.id
                ? React.createElement(UI.InlineConfirm, {
                    message: '¿Eliminar servicio?',
                    onConfirm: () => {
                      void handleDelete(svc.id);
                    },
                    onCancel: () => setConfirmingDeleteId(null),
                  })
                : React.createElement(
                    'div',
                    {
                      className:
                        'flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
                    },
                    React.createElement(UI.Tooltip, {
                      content: 'Editar',
                      children: React.createElement(
                        UI.IconButton,
                        {
                          variant: 'ghost',
                          size: 'xs',
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
    );
  }

  return React.createElement(
    UI.TooltipProvider,
    null,
    React.createElement(
      'div',
      { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
      React.createElement(
        'div',
        { className: 'max-w-6xl mx-auto flex flex-col gap-6' },

        // Header de página
        React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            { className: 'text-2xl font-bold text-cg-text' },
            'Servicios y Precios'
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-cg-text-muted mt-1' },
            'Gestionar servicios veterinarios y sus precios'
          )
        ),

        // Card unificada: toolbar + tabla
        React.createElement(
          UI.Card,
          { className: 'overflow-hidden' },

          // Toolbar: búsqueda + acción
          React.createElement(
            'div',
            { className: 'flex items-center gap-3 p-4' },
            React.createElement(UI.Input, {
              type: 'text',
              placeholder: 'Buscar servicio...',
              value: localSearch,
              onChange: handleSearchChange,
              className: 'flex-1',
            }),
            React.createElement(
              UI.Button,
              { onClick: handleCreate },
              React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 16 }),
              'Nuevo servicio'
            )
          ),

          // Tabs de categorías
          serviceCategories.length > 0 &&
            React.createElement(
              'div',
              { className: 'px-4 pb-4' },
              React.createElement(
                UI.Tabs,
                {
                  value: activeCatId ?? 'all',
                  onValueChange: handleTabChange,
                },
                React.createElement(
                  UI.TabsList,
                  { className: 'bg-transparent p-0' },
                  React.createElement(UI.TabsTrigger, { value: 'all' }, 'Todos'),
                  ...serviceCategories.map((cat: Category) =>
                    React.createElement(UI.TabsTrigger, { key: cat.id, value: cat.id }, cat.name)
                  )
                )
              )
            ),

          React.createElement(UI.Separator, null),

          // Contador de resultados
          !loading &&
            React.createElement(
              'div',
              { className: 'flex justify-end px-4 py-2' },
              React.createElement(
                'span',
                { className: 'text-xs text-cg-text-muted' },
                `${services.length} servicio${services.length === 1 ? '' : 's'}`
              )
            ),

          // Contenido de la tabla
          renderTableContent()
        )
      ),

      // Modal crear/editar servicio
      showModal &&
        React.createElement(UI.FormDialog, {
          open: showModal,
          onOpenChange: (open: boolean) => {
            if (!open) handleCloseModal();
          },
          title: editingService ? 'Editar servicio' : 'Nuevo servicio',
          size: 'sm',
          footer: React.createElement(
            React.Fragment,
            null,
            React.createElement(
              UI.Button,
              { type: 'button', variant: 'outline', onClick: handleCloseModal },
              'Cancelar'
            ),
            React.createElement(
              UI.Button,
              {
                type: 'button',
                onClick: () => {
                  void handleSubmit();
                },
                disabled: isSaving,
              },
              submitLabel
            )
          ),
          children: React.createElement(
            React.Fragment,
            null,

            // Nombre
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Nombre *'),
              React.createElement(UI.Input, {
                type: 'text',
                value: form.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((prev: ServiceFormData) => ({ ...prev, name: e.target.value })),
                placeholder: 'Ej: Consulta general',
              })
            ),

            // Descripción
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Descripción (opcional)'),
              React.createElement(UI.Textarea, {
                value: form.description,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((prev: ServiceFormData) => ({
                    ...prev,
                    description: e.target.value,
                  })),
                rows: 2,
                placeholder: 'Descripción opcional del servicio',
              })
            ),

            // Categoría
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Categoría'),
              React.createElement(
                UI.Select,
                {
                  value: form.categoryId,
                  onValueChange: (v: string) =>
                    setForm((prev: ServiceFormData) => ({
                      ...prev,
                      categoryId: v,
                    })),
                },
                serviceCategories.map((cat: Category) =>
                  React.createElement(UI.SelectItem, { key: cat.id, value: cat.id }, cat.name)
                )
              )
            ),

            // Precio
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Precio'),
              React.createElement(
                'div',
                { className: 'relative' },
                React.createElement(
                  'span',
                  {
                    className:
                      'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cg-text-muted',
                  },
                  '$'
                ),
                React.createElement(UI.Input, {
                  type: 'text',
                  inputMode: 'decimal',
                  value: form.price,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: ServiceFormData) => ({ ...prev, price: e.target.value })),
                  min: '0',
                  step: '0.01',
                  placeholder: '0.00',
                  className: 'pl-7',
                })
              )
            )
          ),
        })
    )
  );
}
