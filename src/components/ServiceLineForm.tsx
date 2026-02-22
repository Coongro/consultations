/**
 * Componente para gestionar líneas de servicios prestados en una consulta.
 *
 * Usa el Combobox de ui-components para buscar en el catálogo de servicios.
 * Si el texto no existe, "Crear '...'" abre un mini-modal que crea el servicio
 * en products y lo agrega a la línea de la consulta.
 */
import { getHostReact, getHostUI, actions } from '@coongro/plugin-sdk';
import type { Product, Category } from '@coongro/products';

import { ROOT_SERVICE_CATEGORY_SLUG } from '../constants/services.js';
import type { ServiceLineInput } from '../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect, useMemo, useRef } = React;

// Formato de precio para mostrar en catálogo y subtotales
function formatPrice(price: string | null): string {
  if (!price || price === '0') return 'Sin precio';
  return `$${parseFloat(price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// Construye una línea de servicio a partir de un producto del catálogo
function buildServiceLine(product: Product): ServiceLineInput {
  return {
    product_id: product.id,
    product_name: product.name,
    quantity: '1',
    unit_price: product.sale_price ?? '0',
    subtotal: product.sale_price ?? '0',
  };
}

export interface ServiceLineFormProps {
  services: ServiceLineInput[];
  onChange: (services: ServiceLineInput[]) => void;
}

interface CreateServiceModalProps {
  initialName: string;
  serviceCategories: Category[];
  onClose: () => void;
  onCreated: (product: Product) => void;
}

function CreateServiceModal({
  initialName,
  serviceCategories,
  onClose,
  onCreated,
}: CreateServiceModalProps) {
  const [name, setName] = useState(initialName);
  const [categoryId, setCategoryId] = useState(serviceCategories[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await actions.execute<Product[]>('products.items.create', {
        data: {
          name: name.trim(),
          category_id: categoryId || null,
          sale_price: price || '0',
          metadata: { type: 'service' },
        },
      });
      const created = Array.isArray(result) ? result[0] : result;
      if (created) onCreated(created as Product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el servicio');
    } finally {
      setSaving(false);
    }
  }, [name, categoryId, price, onCreated]);

  return React.createElement(
    UI.FormDialog,
    {
      open: true,
      onOpenChange: (open: boolean) => { if (!open) onClose(); },
      title: 'Nuevo servicio',
      size: 'sm',
      footer: React.createElement(
        React.Fragment,
        null,
        React.createElement(
          UI.Button,
          { type: 'button', variant: 'outline', onClick: onClose },
          'Cancelar',
        ),
        React.createElement(
          UI.Button,
          { type: 'button', onClick: handleSubmit, disabled: saving },
          saving ? 'Guardando...' : 'Crear servicio',
        ),
      ),
    },

    error &&
      React.createElement(
        'p',
        { className: 'text-sm text-[var(--cg-danger)]' },
        error,
      ),

    // Nombre
    React.createElement(
      'div',
      { className: 'flex flex-col gap-1' },
      React.createElement(UI.Label, null, 'Nombre *'),
      React.createElement(UI.Input, {
        type: 'text',
        value: name,
        autoFocus: true,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
        placeholder: 'Ej: Consulta general',
      }),
    ),

    // Categoría
    serviceCategories.length > 0 &&
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1' },
        React.createElement(UI.Label, null, 'Categoría'),
        React.createElement(
          UI.Select,
          {
            value: categoryId,
            onValueChange: (v: string) => setCategoryId(v),
          },
          React.createElement(UI.SelectItem, { value: '' }, '— Sin categoría —'),
          serviceCategories.map((cat: Category) =>
            React.createElement(UI.SelectItem, { key: cat.id, value: cat.id }, cat.name),
          ),
        ),
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
              'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--cg-text-muted)]',
          },
          '$',
        ),
        React.createElement(UI.Input, {
          type: 'number',
          value: price,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value),
          min: '0',
          step: '0.01',
          placeholder: '0.00',
          className: 'pl-7',
        }),
      ),
    ),
  );
}

interface ServiceSearchContentProps {
  catalog: Product[];
  categoryMap: Map<string, string>;
  onCreateRequest: (name: string) => void;
}

function ServiceSearchContent({
  catalog,
  categoryMap,
  onCreateRequest,
}: ServiceSearchContentProps) {
  const { search, setOpen } = UI.useComboboxContext();

  const filtered = useMemo(() => {
    if (!search.trim()) return catalog.slice(0, 20);
    const q = search.toLowerCase();
    return catalog
      .filter(
        (p: Product) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 20);
  }, [catalog, search]);

  // No mostrar "Crear" si el nombre exacto ya existe
  const queryExistsInCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q.length > 0 && catalog.some((p: Product) => p.name.toLowerCase() === q);
  }, [catalog, search]);

  const handleCreate = useCallback(
    (searchVal: string) => {
      setOpen(false);
      onCreateRequest(searchVal);
    },
    [setOpen, onCreateRequest],
  );

  return React.createElement(
    UI.ComboboxContent,
    null,

    // Items del catálogo
    filtered.length > 0
      ? filtered.map((p: Product) =>
          React.createElement(
            UI.ComboboxItem,
            {
              key: p.id,
              value: p.id,
              subtitle: [
                categoryMap.get(p.category_id ?? '') ?? '',
                formatPrice(p.sale_price),
              ]
                .filter(Boolean)
                .join(' · '),
            },
            p.name,
          ),
        )
      : React.createElement(
          UI.ComboboxEmpty,
          null,
          search.trim() ? 'Sin resultados' : 'Escribe para buscar en el catálogo',
        ),

    // Opción "Crear" (solo si el nombre no existe ya)
    !queryExistsInCatalog &&
      React.createElement(UI.ComboboxCreate, {
        onCreate: handleCreate,
        label: 'Crear "{search}"',
      }),
  );
}

export function ServiceLineForm({ services, onChange }: ServiceLineFormProps) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [createName, setCreateName] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar catálogo de servicios (todas las subcategorías de la raíz)
  useEffect(() => {
    void (async () => {
      try {
        const cats = await actions.execute<Category[]>('products.categories.listTree');
        if (!mountedRef.current) return;
        setCategories(cats);

        const root = cats.find((c: Category) => c.slug === ROOT_SERVICE_CATEGORY_SLUG);
        if (!root) {
          setCatalogLoading(false);
          return;
        }
        const serviceIds = new Set<string>([
          root.id,
          ...cats
            .filter((c: Category) => c.parent_id === root.id)
            .map((c: Category) => c.id),
        ]);

        const all = await actions.execute<Product[]>('products.items.search', {
          limit: 300,
          isActive: true,
        });
        if (!mountedRef.current) return;
        setCatalog(all.filter((p: Product) => serviceIds.has(p.category_id ?? '')));
      } catch {
        // Sin catálogo
      } finally {
        if (mountedRef.current) setCatalogLoading(false);
      }
    })();
  }, []);

  // Subcategorías de servicios para el modal de creación
  const serviceCategories = useMemo(() => {
    const root = categories.find((c: Category) => c.slug === ROOT_SERVICE_CATEGORY_SLUG);
    if (!root) return [];
    return categories.filter((c: Category) => c.parent_id === root.id);
  }, [categories]);

  // Mapa categoría id -> nombre
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const handleSelectProduct = useCallback(
    (productId: string) => {
      const product = catalog.find((p: Product) => p.id === productId);
      if (!product) return;
      onChange([...services, buildServiceLine(product)]);
    },
    [catalog, services, onChange],
  );

  const handleServiceCreated = useCallback(
    (product: Product) => {
      setCatalog((prev) => [...prev, product]);
      onChange([...services, buildServiceLine(product)]);
      setCreateName(null);
    },
    [services, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(services.filter((_: ServiceLineInput, i: number) => i !== index));
    },
    [services, onChange],
  );

  const handleChange = useCallback(
    (index: number, field: keyof ServiceLineInput, value: string) => {
      const updated = services.map((svc: ServiceLineInput, i: number) => {
        if (i !== index) return svc;
        const next = { ...svc, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const qty = parseFloat(next.quantity) || 0;
          const price = parseFloat(next.unit_price) || 0;
          next.subtotal = (qty * price).toFixed(2);
        }
        return next;
      });
      onChange(updated);
    },
    [services, onChange],
  );

  const total = useMemo(
    () =>
      services.reduce(
        (acc: number, s: ServiceLineInput) => acc + (parseFloat(s.subtotal) || 0),
        0,
      ),
    [services],
  );

  return React.createElement(
    UI.TooltipProvider,
    null,
    React.createElement(
      'div',
      { className: 'flex flex-col gap-3' },

      // Modal de creación (cuando se clickea "Crear '...'")
      createName !== null &&
        React.createElement(CreateServiceModal, {
          initialName: createName,
          serviceCategories,
          onClose: () => setCreateName(null),
          onCreated: handleServiceCreated,
        }),

      // Combobox buscador
      React.createElement(
        UI.Combobox,
        {
          value: '',
          onValueChange: handleSelectProduct,
          debounceMs: 0,
        },
        React.createElement(UI.ComboboxChipTrigger, {
          placeholder: catalogLoading
            ? 'Cargando catálogo...'
            : 'Buscar servicio para agregar...',
        }),
        React.createElement(ServiceSearchContent, {
          catalog,
          categoryMap,
          onCreateRequest: (name: string) => setCreateName(name),
        }),
      ),

      // Encabezados (solo si hay líneas)
      services.length > 0 &&
        React.createElement(
          'div',
          {
            className:
              'grid grid-cols-[1fr_70px_90px_90px_32px] gap-2 items-center text-xs text-[var(--cg-text-muted)]',
          },
          React.createElement('span', null, 'Servicio'),
          React.createElement('span', { className: 'text-center' }, 'Cant.'),
          React.createElement('span', { className: 'text-right' }, 'Precio'),
          React.createElement('span', { className: 'text-right' }, 'Subtotal'),
          React.createElement('span', null, ''),
        ),

      // Líneas de servicios
      services.length > 0 &&
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          services.map((svc: ServiceLineInput, index: number) =>
            React.createElement(
              'div',
              {
                key: index,
                className: 'grid grid-cols-[1fr_70px_90px_90px_32px] gap-2 items-center',
              },

              // Nombre
              React.createElement(UI.Input, {
                type: 'text',
                value: svc.product_name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, 'product_name', e.target.value),
                placeholder: 'Nombre del servicio',
                readOnly: !!svc.product_id,
                size: 'sm',
              }),

              // Cantidad
              React.createElement(UI.Input, {
                type: 'number',
                value: svc.quantity,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, 'quantity', e.target.value),
                min: '1',
                step: '1',
                className: 'text-center',
                size: 'sm',
              }),

              // Precio unitario
              React.createElement(UI.Input, {
                type: 'number',
                value: svc.unit_price,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, 'unit_price', e.target.value),
                min: '0',
                step: '0.01',
                className: 'text-right',
                size: 'sm',
              }),

              // Subtotal
              React.createElement(
                'span',
                {
                  className: 'text-sm text-right font-medium text-[var(--cg-text)]',
                },
                `$${(parseFloat(svc.subtotal) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
              ),

              // Eliminar
              React.createElement(
                UI.Tooltip,
                { content: 'Eliminar' },
                React.createElement(
                  UI.IconButton,
                  {
                    variant: 'danger',
                    size: 'xs',
                    onClick: () => handleRemove(index),
                  },
                  React.createElement(UI.DynamicIcon, { icon: 'X', size: 16 }),
                ),
              ),
            ),
          ),
        ),

      // Total
      services.length > 0 &&
        React.createElement(
          'div',
          {
            className:
              'flex items-center justify-end gap-3 pt-2 border-t border-[var(--cg-border)]',
          },
          React.createElement(
            'span',
            { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
            'Total:',
          ),
          React.createElement(
            'span',
            { className: 'text-base font-bold text-[var(--cg-text)]' },
            `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          ),
        ),
    ),
  );
}
