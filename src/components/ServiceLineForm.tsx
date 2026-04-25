/**
 * Componente para gestionar líneas de servicios prestados en una consulta.
 *
 * Diseño tipo ticket/recibo: nombre izquierda, cantidad centro, precio derecha.
 * showPrices controla visibilidad de precios y total, no de la sección completa.
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
  catalog: Product[];
  categories: Category[];
  catalogLoading?: boolean;
  onProductCreated?: (product: Product) => void;
  showPrices?: boolean;
}

interface ServiceSearchContentProps {
  catalog: Product[];
  categoryMap: Map<string, string>;
  onCreateRequest: (name: string) => void;
  showPrices: boolean;
}

function ServiceSearchContent({
  catalog,
  categoryMap,
  onCreateRequest,
  showPrices,
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
                showPrices ? formatPrice(p.sale_price, 'Sin precio') : '',
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
  showPrices = true,
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
        // Silencioso
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

  const handleQuantityChange = useCallback(
    (index: number, value: string) => {
      const updated = services.map((svc: ServiceLineInput, i: number) => {
        if (i !== index) return svc;
        const next = { ...svc, quantity: value };
        const qty = parseFloat(value) || 0;
        const price = parseFloat(next.unit_price) || 0;
        next.subtotal = (qty * price).toFixed(2);
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
      { className: 'flex flex-col gap-3' },

      // Modal de creación
      React.createElement(ServiceFormDialog, {
        open: createName !== null,
        onClose: () => setCreateName(null),
        onSave: handleSaveNewService,
        initialValues: createName !== null ? { name: createName } : null,
        categories,
        saving,
        showDescription: false,
      }),

      // Buscador
      React.createElement(
        UI.Combobox,
        {
          value: '',
          onValueChange: handleSelectProduct,
          debounceMs: 0,
        },
        React.createElement(UI.ComboboxChipTrigger, {
          placeholder: catalogLoading ? 'Cargando catálogo...' : 'Agregar servicio...',
        }),
        React.createElement(ServiceSearchContent, {
          catalog,
          categoryMap,
          onCreateRequest: (name: string) => setCreateName(name),
          showPrices,
        })
      ),

      // Filas tipo ticket
      services.length > 0 &&
        React.createElement(
          'div',
          { className: 'flex flex-col' },

          services.map((svc: ServiceLineInput, index: number) => {
            const qty = parseFloat(svc.quantity) || 0;
            const unitPrice = parseFloat(svc.unit_price) || 0;
            const hasMultiple = qty > 1;
            const isLast = index === services.length - 1;

            return React.createElement(
              'div',
              {
                key: index,
                className: `grid items-center py-2.5 gap-2 min-w-0 ${
                  !isLast ? 'border-b border-dashed border-[var(--cg-border)]' : ''
                }`,
                style: {
                  gridTemplateColumns: showPrices ? '1fr 48px 80px 24px' : '1fr 48px 24px',
                },
              },

              // Nombre
              React.createElement(
                'span',
                {
                  className:
                    'flex-1 text-[13px] font-medium text-[var(--cg-text)] min-w-0 truncate',
                },
                svc.product_name
              ),

              // Cantidad (input editable)
              React.createElement(UI.Input, {
                type: 'number',
                value: svc.quantity,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  handleQuantityChange(index, e.target.value),
                min: '1',
                step: '1',
                size: 'sm',
                className: '!w-[48px] text-center',
              }),

              // Precio (Noto Serif, solo si showPrices)
              showPrices &&
                React.createElement(
                  'div',
                  { className: 'flex flex-col items-end' },
                  React.createElement(
                    'span',
                    {
                      className: 'text-[13px] font-medium text-[var(--cg-text-secondary)]',
                      style: { fontFamily: "'Noto Serif JP', serif" },
                    },
                    formatCurrency(parseFloat(svc.subtotal) || 0)
                  ),
                  hasMultiple &&
                    React.createElement(
                      'span',
                      { className: 'text-[10px] text-[var(--cg-text-muted)]' },
                      `${String(qty)} x ${formatCurrency(unitPrice)}`
                    )
                ),

              // Eliminar
              React.createElement(
                UI.IconButton,
                {
                  variant: 'danger',
                  size: 'xs',
                  onClick: () => handleRemove(index),
                },
                React.createElement(UI.DynamicIcon, { icon: 'X', size: 14 })
              )
            );
          }),

          // Total
          showPrices &&
            React.createElement(
              'div',
              {
                className:
                  'flex items-center justify-between mt-2 pt-2.5 border-t border-[var(--cg-border)]',
              },
              React.createElement(
                'span',
                {
                  className:
                    'text-xs font-bold text-[var(--cg-text-muted)] uppercase tracking-wide',
                },
                'Total'
              ),
              React.createElement(
                'span',
                {
                  className: 'text-[17px] font-black text-[var(--cg-text)]',
                  style: { fontFamily: "'Noto Serif JP', serif" },
                },
                formatCurrency(total)
              )
            )
        )
    )
  );
}
