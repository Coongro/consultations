/**
 * Componente para gestionar líneas de servicios prestados en una consulta.
 *
 * Usa el Combobox de ui-components para buscar en el catálogo de servicios.
 * Si el texto no existe, "Crear '...'" abre un ServiceFormDialog para crear
 * el servicio y agregarlo a la línea de la consulta.
 */
import { getHostReact, getHostUI, actions } from '@coongro/plugin-sdk';
import type { Product, Category } from '@coongro/products';

import type { ServiceLineInput } from '../types/consultation.js';
import { createCategoryMap } from '../utils/categories.js';
import { formatCurrency, formatPrice } from '../utils/price.js';

import { ServiceFormDialog } from './ServiceFormDialog.js';
import type { ServiceFormValues } from './ServiceFormDialog.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useMemo } = React;

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
  /** Catálogo de productos/servicios disponibles */
  catalog: Product[];
  /** Categorías para el modal de creación de servicio */
  categories: Category[];
  /** Indica si el catálogo está cargando */
  catalogLoading?: boolean;
  /** Callback cuando se crea un producto nuevo (para que el caller actualice su catálogo) */
  onProductCreated?: (product: Product) => void;
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
          p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 20);
  }, [catalog, search]);

  const queryExistsInCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q.length > 0 && catalog.some((p: Product) => p.name.toLowerCase() === q);
  }, [catalog, search]);

  const handleCreate = useCallback(
    (searchVal: string) => {
      setOpen(false);
      onCreateRequest(searchVal);
    },
    [setOpen, onCreateRequest]
  );

  return React.createElement(
    UI.ComboboxContent,
    null,

    filtered.length > 0
      ? filtered.map((p: Product) =>
          React.createElement(
            UI.ComboboxItem,
            {
              key: p.id,
              value: p.id,
              subtitle: [
                categoryMap.get(p.category_id ?? '') ?? '',
                formatPrice(p.sale_price, 'Sin precio'),
              ]
                .filter(Boolean)
                .join(' · '),
            },
            p.name
          )
        )
      : React.createElement(
          UI.ComboboxEmpty,
          null,
          search.trim() ? 'Sin resultados' : 'Escribe para buscar en el catálogo'
        ),

    !queryExistsInCatalog &&
      React.createElement(UI.ComboboxCreate, {
        onCreate: handleCreate,
        label: 'Crear "{search}"',
      })
  );
}

export function ServiceLineForm({
  services,
  onChange,
  catalog,
  categories,
  catalogLoading = false,
  onProductCreated,
}: ServiceLineFormProps) {
  const [createName, setCreateName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categoryMap = useMemo(() => createCategoryMap(categories), [categories]);

  const handleSelectProduct = useCallback(
    (productId: string) => {
      const product = catalog.find((p: Product) => p.id === productId);
      if (!product) return;
      onChange([...services, buildServiceLine(product)]);
    },
    [catalog, services, onChange]
  );

  const handleSaveNewService = useCallback(
    async (values: ServiceFormValues): Promise<boolean> => {
      setSaving(true);
      try {
        const result = await actions.execute<Product[]>('products.items.create', {
          data: {
            name: values.name.trim(),
            category_id: values.categoryId || null,
            sale_price: values.price || '0',
            metadata: { type: 'service' },
          },
        });
        const created = Array.isArray(result) ? result[0] : result;
        if (created) {
          onProductCreated?.(created);
          onChange([...services, buildServiceLine(created)]);
          return true;
        }
      } catch {
        // El ServiceFormDialog no muestra toast; lo manejamos silenciosamente
      } finally {
        setSaving(false);
      }
      return false;
    },
    [services, onChange, onProductCreated]
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(services.filter((_: ServiceLineInput, i: number) => i !== index));
    },
    [services, onChange]
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
    [services, onChange]
  );

  const total = useMemo(
    () =>
      services.reduce((acc: number, s: ServiceLineInput) => acc + (parseFloat(s.subtotal) || 0), 0),
    [services]
  );

  return React.createElement(
    UI.TooltipProvider,
    null,
    React.createElement(
      'div',
      { className: 'flex flex-col gap-4' },

      // Modal de creación via ServiceFormDialog reutilizable
      React.createElement(ServiceFormDialog, {
        open: createName !== null,
        onClose: () => setCreateName(null),
        onSave: handleSaveNewService,
        initialValues: createName !== null ? { name: createName } : null,
        categories,
        saving,
        showDescription: false,
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
          placeholder: catalogLoading ? 'Cargando catálogo...' : 'Buscar servicio para agregar...',
        }),
        React.createElement(ServiceSearchContent, {
          catalog,
          categoryMap,
          onCreateRequest: (name: string) => setCreateName(name),
        })
      ),

      // Líneas de servicios
      services.length > 0 &&
        React.createElement(
          'div',
          {
            className: 'rounded-md border border-[var(--cg-border)] overflow-hidden',
          },

          // Encabezados
          React.createElement(
            'div',
            {
              className:
                'grid grid-cols-[1fr_70px_90px_90px_32px] gap-2 items-center px-3 py-2 bg-[var(--cg-surface-raised)] text-xs font-medium text-[var(--cg-text-muted)] border-b border-[var(--cg-border)]',
            },
            React.createElement('span', null, 'Servicio'),
            React.createElement('span', { className: 'text-center' }, 'Cant.'),
            React.createElement('span', { className: 'text-right' }, 'Precio unit.'),
            React.createElement('span', { className: 'text-right' }, 'Subtotal'),
            React.createElement('span', null, '')
          ),

          // Filas
          React.createElement(
            'div',
            { className: 'divide-y divide-[var(--cg-border)]' },
            services.map((svc: ServiceLineInput, index: number) =>
              React.createElement(
                'div',
                {
                  key: index,
                  className:
                    'grid grid-cols-[1fr_70px_90px_90px_32px] gap-2 items-center px-3 py-2',
                },

                React.createElement(UI.Input, {
                  type: 'text',
                  value: svc.product_name,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(index, 'product_name', e.target.value),
                  placeholder: 'Nombre del servicio',
                  readOnly: !!svc.product_id,
                  size: 'sm',
                }),

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

                React.createElement(
                  'span',
                  { className: 'text-sm text-right font-medium text-[var(--cg-text)]' },
                  formatCurrency(parseFloat(svc.subtotal) || 0)
                ),

                React.createElement(UI.Tooltip, {
                  content: 'Eliminar',
                  children: React.createElement(
                    UI.IconButton,
                    {
                      variant: 'danger',
                      size: 'xs',
                      onClick: () => handleRemove(index),
                    },
                    React.createElement(UI.DynamicIcon, { icon: 'X', size: 16 })
                  ),
                })
              )
            )
          ),

          // Total
          React.createElement(
            'div',
            {
              className:
                'flex items-center justify-end gap-3 px-3 py-2.5 border-t border-[var(--cg-border)] bg-[var(--cg-surface-raised)]',
            },
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-[var(--cg-text-muted)]' },
              'Total:'
            ),
            React.createElement(
              'span',
              { className: 'text-base font-bold text-[var(--cg-text)]' },
              formatCurrency(total)
            )
          )
        )
    )
  );
}
