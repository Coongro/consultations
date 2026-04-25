/**
 * Dialog reutilizable para crear/editar un servicio veterinario.
 *
 * Usado por:
 * - ServicesView (ABM completo con edición)
 * - ServiceLineForm (creación rápida desde consulta)
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';
import type { Category } from '@coongro/products';

import { isValidPrice } from '../utils/price.js';

import { PriceInput } from './PriceInput.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useEffect } = React;

export interface ServiceFormValues {
  name: string;
  description: string;
  categoryId: string;
  price: string;
}

interface FormErrors {
  name?: string;
  price?: string;
}

const EMPTY_FORM: ServiceFormValues = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
};

function validate(form: ServiceFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
  if (form.price && !isValidPrice(form.price)) errors.price = 'Ingresá un precio válido';
  return errors;
}

export interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: ServiceFormValues) => Promise<boolean>;
  /** Valores iniciales para edición. Si es null, es creación. */
  initialValues?: Partial<ServiceFormValues> | null;
  categories: Category[];
  /** Indica si el caller está procesando el guardado. */
  saving?: boolean;
  /** Mostrar campo de descripción (default: true). */
  showDescription?: boolean;
}

export function ServiceFormDialog({
  open,
  onClose,
  onSave,
  initialValues = null,
  categories,
  saving = false,
  showDescription = true,
}: ServiceFormDialogProps) {
  const isEditing = !!initialValues;

  const [form, setForm] = useState<ServiceFormValues>(() => ({
    ...EMPTY_FORM,
    categoryId: categories[0]?.id ?? '',
    ...initialValues,
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        categoryId: categories[0]?.id ?? '',
        ...initialValues,
      });
      setErrors({});
      setTouched({});
    }
  }, [open, initialValues, categories]);

  const handleBlur = useCallback(
    (field: keyof ServiceFormValues) => {
      setTouched((prev: Record<string, boolean>) => ({ ...prev, [field]: true }));
      setErrors(validate(form));
    },
    [form]
  );

  const handleSubmit = useCallback(async () => {
    const errs = validate(form);
    setErrors(errs);
    setTouched({ name: true, price: true });
    if (Object.keys(errs).length > 0) return;

    const ok = await onSave(form);
    if (ok) onClose();
  }, [form, onSave, onClose]);

  return React.createElement(UI.FormDialogSubmit, {
    open,
    onOpenChange: (o: boolean) => {
      if (!o) onClose();
    },
    title: isEditing ? 'Editar servicio' : 'Nuevo servicio',
    size: 'sm',
    submitLabel: isEditing ? 'Guardar cambios' : 'Crear servicio',
    onCancel: onClose,
    disabled: !form.name.trim() || saving,
    children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
      React.createElement(
        'form',
        {
          ref: formRef,
          onSubmit: (e: React.FormEvent) => {
            e.preventDefault();
            void handleSubmit();
          },
          className: 'flex flex-col gap-4',
        },

        // Nombre
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5' },
          React.createElement(UI.Label, { htmlFor: 'svc-name' }, 'Nombre *'),
          React.createElement(UI.Input, {
            id: 'svc-name',
            type: 'text',
            value: form.name,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev: ServiceFormValues) => ({ ...prev, name: e.target.value })),
            onBlur: () => handleBlur('name'),
            placeholder: 'Ej: Consulta general',
            maxLength: 200,
            autoFocus: !isEditing,
            'aria-invalid': touched.name && !!errors.name,
            className: touched.name && errors.name ? 'border-cg-danger' : '',
          }),
          touched.name &&
            errors.name &&
            React.createElement(
              'p',
              { className: 'text-xs text-cg-danger', role: 'alert' },
              errors.name
            )
        ),

        // Descripción (opcional, configurable)
        showDescription &&
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1.5' },
            React.createElement(UI.Label, { htmlFor: 'svc-desc' }, 'Descripción (opcional)'),
            React.createElement(UI.Textarea, {
              id: 'svc-desc',
              value: form.description,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((prev: ServiceFormValues) => ({
                  ...prev,
                  description: e.target.value,
                })),
              rows: 2,
              placeholder: 'Ej: Incluye análisis de sangre completo',
              maxLength: 500,
            })
          ),

        // Categoría + Precio
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },

          categories.length > 0 &&
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1.5' },
              React.createElement(UI.Label, null, 'Categoría'),
              React.createElement(
                UI.Select,
                {
                  value: form.categoryId,
                  onValueChange: (v: string) =>
                    setForm((prev: ServiceFormValues) => ({
                      ...prev,
                      categoryId: v,
                    })),
                },
                categories.map((cat: Category) =>
                  React.createElement(UI.SelectItem, { key: cat.id, value: cat.id }, cat.name)
                )
              )
            ),

          React.createElement(
            'div',
            { className: 'flex flex-col gap-1.5' },
            React.createElement(UI.Label, { htmlFor: 'svc-price' }, 'Precio'),
            React.createElement(PriceInput, {
              id: 'svc-price',
              value: form.price,
              onChange: (val: string) =>
                setForm((prev: ServiceFormValues) => ({ ...prev, price: val })),
              onBlur: () => handleBlur('price'),
              hasError: !!touched.price && !!errors.price,
              errorMessage: errors.price,
            })
          )
        )
      ),
  });
}
