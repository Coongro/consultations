/**
 * Plan de tratamiento (P de SOAP) — sección unificada de la consulta.
 *
 * Diseño aprobado (A:/Coongro2/Plan Tratamiento): "lo que le indicás, recetás y
 * aplicás al paciente" en UN solo lugar. Acá se consolidan medicamentos +
 * servicios bajo una sola tarjeta, con un toggle de precios visible/oculto.
 *
 * Reusa los editores probados (MedicationFormList / ServiceLineForm) en vez de
 * reescribirlos: la lógica de guardado del form (medications[] + services[]) NO
 * cambia, así que el wiring a consultations.medications / consultations.services
 * queda intacto.
 *
 * Diferido vs diseño exacto (necesita schema / cross-plugin, ver memoria
 * plan_tratamiento_spec_coong214): lista única interleaved por tipo, ítem de tipo
 * "vacuna" con registro en el carnet (plugin vaccination), y precio por
 * medicamento (el modelo MedicationInput no tiene precio).
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';
import type { Product, Category } from '@coongro/products';

import type { ServiceLineInput } from '../types/consultation.js';

import { ServiceLineForm } from './ServiceLineForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState } = React;

export interface PlanTratamientoProps {
  /**
   * Nodo de medicación ya resuelto por el form (sección contribuida por un
   * plugin, o la MedicationFormList nativa). Se recibe armado para no romper el
   * mecanismo de view-contributions de consultations.form.open.
   */
  medicationsNode: React.ReactNode;
  services: ServiceLineInput[];
  onServicesChange: (services: ServiceLineInput[]) => void;
  catalog: Product[];
  categories: Category[];
  catalogLoading?: boolean;
  onProductCreated?: (product: Product) => void;
  /** Default de visibilidad de precios (setting consultations.showPrices). */
  defaultShowPrices?: boolean;
}

function BlockLabel({ icon, title, note }: { icon: string; title: string; note?: string }) {
  return React.createElement(
    'div',
    { className: 'flex items-center gap-2 text-xs font-semibold text-cg-text-muted' },
    React.createElement(UI.DynamicIcon, { icon, size: 13 }),
    title,
    note && React.createElement('span', { className: 'font-normal text-cg-text-muted/70' }, note)
  );
}

export function PlanTratamiento({
  medicationsNode,
  services,
  onServicesChange,
  catalog,
  categories,
  catalogLoading = false,
  onProductCreated,
  defaultShowPrices = true,
}: PlanTratamientoProps) {
  // El toggle de precios es local a la sección (el setting define el default).
  const [pricesVisible, setPricesVisible] = useState(defaultShowPrices !== false);

  return React.createElement(
    'div',
    { className: 'flex flex-col gap-4' },

    // Toggle de precios (eye / eye-off), alineado a la derecha.
    React.createElement(
      'div',
      { className: 'flex justify-end' },
      React.createElement(
        UI.Button,
        {
          type: 'button',
          variant: 'ghost',
          size: 'xs',
          onClick: () => setPricesVisible((v: boolean) => !v),
          title: 'Mostrar u ocultar los precios de esta sección',
        },
        React.createElement(UI.DynamicIcon, { icon: pricesVisible ? 'Eye' : 'EyeOff', size: 14 }),
        pricesVisible ? 'Precios visibles' : 'Precios ocultos'
      )
    ),

    // Bloque medicamentos.
    React.createElement(
      'div',
      { className: 'flex flex-col gap-2' },
      React.createElement(BlockLabel, {
        icon: 'Pill',
        title: 'Medicamentos',
        note: '— lo que recetás',
      }),
      medicationsNode
    ),

    // Bloque servicios y vacunas.
    React.createElement(
      'div',
      { className: 'flex flex-col gap-2' },
      React.createElement(BlockLabel, {
        icon: 'Receipt',
        title: 'Servicios',
        note: '— lo que prestás',
      }),
      React.createElement(ServiceLineForm, {
        services,
        onChange: onServicesChange,
        catalog,
        categories,
        catalogLoading,
        onProductCreated,
        showPrices: pricesVisible,
      })
    )
  );
}
