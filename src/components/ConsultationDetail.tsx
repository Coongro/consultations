/**
 * Vista detallada de una consulta con layout de dos columnas.
 * Header con info de mascota, sidebar sticky (vet, vitales, seguimiento),
 * y contenido clínico principal.
 */
import { getHostReact, getHostUI, useViewContributions, actions } from '@coongro/plugin-sdk';

import { useConsultation } from '../hooks/useConsultation.js';
import { useConsultationsSettings } from '../hooks/useConsultationsSettings.js';
import type { ConsultationDetailProps } from '../types/components.js';
import type { ConsultationService } from '../types/consultation.js';
import {
  formatConsultationDateTime,
  formatReasonCategory,
  getReasonCategoryBadgeVariant,
  getReasonCategoryEmoji,
} from '../utils/labels.js';

import { MedicationList } from './MedicationList.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useRef } = React;

// Mapa de secciones clínicas -> iconos lucide
const SECTION_ICONS: Record<string, string> = {
  'Motivo de consulta': 'ClipboardList',
  Anamnesis: 'MessageSquare',
  'Examen físico': 'Stethoscope',
  Diagnóstico: 'Activity',
  Tratamiento: 'Pill',
  Seguimiento: 'PenLine',
  Notas: 'FileText',
};

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  other: '🐾',
};

const SEX_LABELS: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido',
};

interface PetInfo {
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  sex: string | null;
}

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${Math.max(0, totalMonths)} meses`;
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

export function ConsultationDetail(props: ConsultationDetailProps) {
  const {
    consultationId,
    extraSections = [],
    extraActions = [],
    onEdit,
    onDelete,
    onBack,
    onNavigate: _onNavigate,
    className = '',
  } = props;

  const { consultation, medications, services, loading, error, refetch } = useConsultation(consultationId);
  const { settings: consultSettings } = useConsultationsSettings();

  // Contribuciones de otros plugins para la zona de medicamentos
  const { sections: medContributions } = useViewContributions('consultations.detail.open', {
    consultationId,
    medications,
  });

  // Fetch de datos de la mascota
  const [pet, setPet] = useState<PetInfo | null>(null);
  const petFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!consultation?.pet_id || petFetchedRef.current === consultation.pet_id) return;
    petFetchedRef.current = consultation.pet_id;
    let cancelled = false;
    void (async () => {
      try {
        const result = await actions.execute<PetInfo>('patients.pets.getById', {
          id: consultation.pet_id,
        });
        if (!cancelled && result) setPet(result);
      } catch {
        // Silencioso — el header muestra fallback sin datos de mascota
      }
    })();
    return () => { cancelled = true; };
  }, [consultation?.pet_id]);

  // --- Loading ---
  if (loading) {
    return React.createElement(
      'div',
      { className: `flex flex-col gap-6 ${className}` },
      React.createElement(UI.Skeleton, { className: 'h-10 w-48 rounded-lg' }),
      React.createElement(UI.Skeleton, { className: 'h-24 rounded-2xl' }),
      React.createElement(
        'div',
        { className: 'flex flex-col lg:flex-row gap-6' },
        React.createElement(
          'div',
          { className: 'w-full lg:w-80 flex flex-col gap-4' },
          React.createElement(UI.Skeleton, { className: 'h-20 rounded-2xl' }),
          React.createElement(UI.Skeleton, { className: 'h-28 rounded-2xl' }),
          React.createElement(UI.Skeleton, { className: 'h-16 rounded-2xl' }),
        ),
        React.createElement(
          'div',
          { className: 'flex-1 flex flex-col gap-4' },
          React.createElement(UI.Skeleton, { className: 'h-48 rounded-2xl' }),
          React.createElement(UI.Skeleton, { className: 'h-32 rounded-2xl' }),
        ),
      ),
    );
  }

  // --- Error ---
  if (error || !consultation) {
    return React.createElement(
      'div',
      { className: 'flex flex-col items-center py-12 gap-3' },
      error
        ? React.createElement(UI.ErrorDisplay, {
            title: 'Error al cargar',
            message: error,
            onRetry: refetch,
          })
        : React.createElement(UI.EmptyState, {
            title: 'Consulta no encontrada',
          }),
    );
  }

  const c = consultation;
  const categoryLabel = formatReasonCategory(c.reason_category);
  const badgeVariant = getReasonCategoryBadgeVariant(c.reason_category);
  const sortedSections = [...extraSections].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  // Secciones clínicas (solo si tienen contenido)
  const clinicalSections = [
    { label: 'Motivo de consulta', value: c.reason },
    { label: 'Anamnesis', value: c.anamnesis },
    { label: 'Examen físico', value: c.physical_exam },
    { label: 'Diagnóstico', value: c.diagnosis },
    { label: 'Tratamiento', value: c.treatment },
    { label: 'Seguimiento', value: c.follow_up_notes },
    { label: 'Notas', value: c.notes },
  ].filter((s) => s.value);

  const hasVitals = c.weight_kg || c.temperature;

  // Info de mascota para el header
  const petEmoji = pet ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
  const petName = pet?.name ?? 'Paciente';
  const petDetails = [
    pet?.breed,
    pet?.birth_date ? calculateAge(pet.birth_date) : null,
    pet?.sex ? SEX_LABELS[pet.sex] ?? pet.sex : null,
  ].filter(Boolean).join(' · ');

  return React.createElement(
    'div',
    { className: `flex flex-col gap-6 ${className}` },

    // ── Barra de navegación ──
    React.createElement(
      'div',
      { className: 'flex items-center justify-between' },
      onBack &&
        React.createElement(
          UI.Button,
          { variant: 'ghost', size: 'sm', onClick: onBack },
          React.createElement(UI.DynamicIcon, { icon: 'ArrowLeft', size: 16 }),
          'Volver a consultas',
        ),
      React.createElement(
        'div',
        { className: 'flex gap-2' },
        onEdit &&
          React.createElement(
            UI.Button,
            { variant: 'outline', size: 'sm', onClick: () => onEdit(c) },
            React.createElement(UI.DynamicIcon, { icon: 'Pencil', size: 14 }),
            'Editar',
          ),
        onDelete &&
          React.createElement(
            UI.Button,
            { variant: 'destructive', size: 'sm', onClick: () => onDelete(c) },
            React.createElement(UI.DynamicIcon, { icon: 'Trash2', size: 14 }),
            'Eliminar',
          ),
        extraActions.map((action, i) =>
          React.createElement(
            UI.Button,
            { key: i, variant: 'outline', size: 'sm', onClick: () => action.onClick(c) },
            action.label,
          ),
        ),
      ),
    ),

    // ── Header Banner ──
    React.createElement(
      UI.Card,
      { className: 'overflow-hidden' },
      React.createElement('div', { className: 'h-1 bg-cg-accent' }),
      React.createElement(
        'div',
        { className: 'p-5' },
        React.createElement(
          'div',
          { className: 'flex items-start justify-between' },
          // Lado izquierdo: avatar + info de mascota + fecha
          React.createElement(
            'div',
            { className: 'flex items-center gap-4' },
            React.createElement(UI.Avatar, {
              size: 'lg',
              icon: React.createElement('span', { className: 'text-2xl' }, petEmoji),
            }),
            React.createElement(
              'div',
              null,
              React.createElement(
                'h1',
                { className: 'text-xl font-bold text-cg-text' },
                petName,
              ),
              petDetails &&
                React.createElement(
                  'p',
                  { className: 'text-sm text-cg-text-muted mt-0.5' },
                  petDetails,
                ),
              React.createElement(
                'p',
                { className: 'text-sm text-cg-text-muted mt-1' },
                formatConsultationDateTime(c.date),
              ),
            ),
          ),
          // Lado derecho: badge de categoría + tags
          React.createElement(
            'div',
            { className: 'flex flex-col items-end gap-2' },
            categoryLabel &&
              React.createElement(
                UI.Badge,
                { variant: badgeVariant as 'info' },
                categoryLabel,
              ),
            c.diagnosis_tags &&
              Array.isArray(c.diagnosis_tags) &&
              c.diagnosis_tags.length > 0 &&
              React.createElement(
                'div',
                { className: 'flex flex-wrap gap-1.5 justify-end' },
                c.diagnosis_tags.map((tag: string, i: number) =>
                  React.createElement(
                    UI.Badge,
                    { key: i, variant: 'secondary', size: 'sm' },
                    tag,
                  ),
                ),
              ),
          ),
        ),
      ),
    ),

    // ── Two-column body ──
    React.createElement(
      'div',
      { className: 'flex flex-col lg:flex-row gap-6' },

      // ── SIDEBAR ──
      React.createElement(
        'div',
        { className: 'w-full lg:w-80 lg:shrink-0 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start' },

        // Veterinario
        React.createElement(
          UI.Card,
          { className: 'p-4' },
          React.createElement(
            'div',
            { className: 'flex items-center gap-3' },
            React.createElement(UI.Avatar, { size: 'sm', name: c.vet_name }),
            React.createElement(
              'div',
              null,
              React.createElement(
                'span',
                { className: 'text-xs text-cg-text-muted uppercase tracking-wider block' },
                'Veterinario/a',
              ),
              React.createElement(
                'span',
                { className: 'text-sm font-medium text-cg-text' },
                `Dr(a). ${c.vet_name}`,
              ),
            ),
          ),
        ),

        // Signos vitales
        hasVitals &&
          React.createElement(
            UI.Card,
            { className: 'p-4' },
            React.createElement(
              'h3',
              { className: 'text-xs font-semibold uppercase tracking-wider text-cg-text-muted mb-3' },
              'Signos vitales',
            ),
            React.createElement(
              'div',
              { className: 'grid grid-cols-2 gap-3' },
              c.weight_kg &&
                React.createElement(
                  'div',
                  { className: 'flex items-center gap-2 p-3 rounded-lg bg-cg-bg-secondary' },
                  React.createElement(UI.DynamicIcon, {
                    icon: 'Scale',
                    size: 16,
                    className: 'text-cg-text-muted shrink-0',
                  }),
                  React.createElement(
                    'div',
                    null,
                    React.createElement('span', { className: 'text-xs text-cg-text-muted block' }, 'Peso'),
                    React.createElement('span', { className: 'text-sm font-semibold text-cg-text' }, `${c.weight_kg} kg`),
                  ),
                ),
              c.temperature &&
                React.createElement(
                  'div',
                  { className: 'flex items-center gap-2 p-3 rounded-lg bg-cg-bg-secondary' },
                  React.createElement(UI.DynamicIcon, {
                    icon: 'Thermometer',
                    size: 16,
                    className: 'text-cg-text-muted shrink-0',
                  }),
                  React.createElement(
                    'div',
                    null,
                    React.createElement('span', { className: 'text-xs text-cg-text-muted block' }, 'Temp.'),
                    React.createElement('span', { className: 'text-sm font-semibold text-cg-text' }, `${c.temperature}°C`),
                  ),
                ),
            ),
          ),

        // Próximo control
        c.follow_up_date &&
          React.createElement(
            UI.Card,
            { className: 'p-4 border-cg-warning-border bg-cg-warning-bg' },
            React.createElement(
              'div',
              { className: 'flex items-center gap-2 mb-2' },
              React.createElement(UI.DynamicIcon, {
                icon: 'Calendar',
                size: 16,
                className: 'text-cg-warning-text',
              }),
              React.createElement(
                'span',
                { className: 'text-xs font-semibold uppercase tracking-wider text-cg-text-muted' },
                'Próximo control',
              ),
            ),
            React.createElement(
              'p',
              { className: 'text-sm font-medium text-cg-text' },
              new Date(c.follow_up_date).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            ),
          ),

        // Metadata
        React.createElement(
          UI.Card,
          { className: 'p-4' },
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1 text-xs text-cg-text-muted' },
            React.createElement('span', null, `Creado: ${new Date(c.created_at).toLocaleDateString('es-AR')}`),
            React.createElement('span', null, `Actualizado: ${new Date(c.updated_at).toLocaleDateString('es-AR')}`),
          ),
        ),
      ),

      // ── MAIN CONTENT ──
      React.createElement(
        'div',
        { className: 'flex-1 min-w-0 flex flex-col gap-5 bg-cg-bg rounded-xl border border-cg-border p-6' },

        // Secciones clínicas (sin Card, aspecto de nota médica)
        clinicalSections.length > 0 &&
          React.createElement(
            'div',
            { className: 'flex flex-col' },
            clinicalSections.map((section, idx) =>
              React.createElement(
                'div',
                { key: section.label },
                React.createElement(
                  'div',
                  { className: 'py-4' },
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-2 mb-2' },
                    React.createElement(UI.DynamicIcon, {
                      icon: SECTION_ICONS[section.label] ?? 'FileText',
                      size: 15,
                      className: 'text-cg-text-muted shrink-0',
                    }),
                    React.createElement(
                      'h3',
                      { className: 'text-xs font-semibold uppercase tracking-wider text-cg-text-muted' },
                      section.label,
                    ),
                  ),
                  React.createElement(
                    'p',
                    { className: 'text-sm text-cg-text whitespace-pre-wrap leading-relaxed pl-[23px]' },
                    section.value,
                  ),
                ),
                // Separador entre secciones (excepto la última)
                idx < clinicalSections.length - 1 &&
                  React.createElement(UI.Separator, null),
              ),
            ),
          ),

        // Medicamentos
        medications.length > 0 &&
          React.createElement(
            UI.Card,
            { className: 'overflow-hidden' },
            React.createElement(
              'div',
              { className: 'px-5 py-3 border-b border-cg-border bg-cg-bg-secondary flex items-center gap-2' },
              React.createElement(UI.DynamicIcon, {
                icon: 'Pill',
                size: 15,
                className: 'text-cg-text-muted',
              }),
              React.createElement(
                'h2',
                { className: 'text-sm font-semibold text-cg-text' },
                `Medicación (${medications.length})`,
              ),
            ),
            React.createElement(
              'div',
              { className: 'p-5' },
              ...(medContributions.length > 0
                ? medContributions.map((s, i) =>
                    React.createElement(React.Fragment, { key: `med-contrib-${String(i)}` }, s.render() as React.ReactNode)
                  )
                : [React.createElement(MedicationList, { key: 'native-meds', medications })]),
            ),
          ),

        // Servicios prestados
        consultSettings.showPrices &&
          services.length > 0 &&
          (() => {
            const servicesTotal = services.reduce(
              (acc: number, s: ConsultationService) => acc + parseFloat(s.subtotal),
              0
            );
            return React.createElement(
              UI.Card,
              { className: 'overflow-hidden' },
              // Header
              React.createElement(
                'div',
                { className: 'px-5 py-3 border-b border-cg-border bg-cg-bg-secondary flex items-center gap-2' },
                React.createElement(UI.DynamicIcon, {
                  icon: 'ClipboardList',
                  size: 15,
                  className: 'text-cg-text-muted',
                }),
                React.createElement(
                  'h2',
                  { className: 'text-sm font-semibold text-cg-text' },
                  'Servicios prestados',
                ),
              ),
              // Resumen: cantidad + total
              React.createElement(
                'div',
                { className: 'px-5 py-4 flex items-center gap-4' },
                React.createElement(
                  'div',
                  { className: 'flex items-center gap-2 px-3 py-2 rounded-lg bg-cg-bg-secondary' },
                  React.createElement(UI.DynamicIcon, { icon: 'Package', size: 16, className: 'text-cg-text-muted' }),
                  React.createElement(
                    'div',
                    null,
                    React.createElement('span', { className: 'text-xs text-cg-text-muted block' }, 'Servicios'),
                    React.createElement('span', { className: 'text-sm font-semibold text-cg-text' }, String(services.length)),
                  ),
                ),
                React.createElement(
                  'div',
                  { className: 'flex items-center gap-2 px-4 py-2 rounded-lg bg-cg-success-bg' },
                  React.createElement(UI.DynamicIcon, { icon: 'DollarSign', size: 16, className: 'text-cg-success-text' }),
                  React.createElement(
                    'div',
                    null,
                    React.createElement('span', { className: 'text-xs text-cg-text-muted block' }, 'Total'),
                    React.createElement(
                      'span',
                      { className: 'text-lg font-bold text-cg-success-text' },
                      `$${servicesTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                    ),
                  ),
                ),
              ),
              // Tabla de detalle
              React.createElement(
                'div',
                { className: 'overflow-x-auto' },
                React.createElement(
                  UI.Table,
                  null,
                  React.createElement(
                    UI.TableHeader,
                    null,
                    React.createElement(
                      UI.TableRow,
                      null,
                      React.createElement(UI.TableHead, null, 'Servicio'),
                      React.createElement(UI.TableHead, { className: 'text-center' }, 'Cant.'),
                      React.createElement(UI.TableHead, { className: 'text-right' }, 'Precio'),
                      React.createElement(UI.TableHead, { className: 'text-right' }, 'Subtotal'),
                    ),
                  ),
                  React.createElement(
                    UI.TableBody,
                    null,
                    services.map((svc: ConsultationService) =>
                      React.createElement(
                        UI.TableRow,
                        { key: svc.id },
                        React.createElement(
                          UI.TableCell,
                          { className: 'font-medium' },
                          svc.product_name,
                          svc.notes && React.createElement('span', { className: 'text-xs text-cg-text-muted ml-2 font-normal' }, `(${svc.notes})`),
                        ),
                        React.createElement(UI.TableCell, { className: 'text-center' }, svc.quantity),
                        React.createElement(UI.TableCell, { className: 'text-right' }, `$${parseFloat(svc.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`),
                        React.createElement(UI.TableCell, { className: 'text-right font-medium' }, `$${parseFloat(svc.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`),
                      ),
                    ),
                  ),
                ),
              ),
            );
          })(),

        // Secciones extra (plugins)
        ...sortedSections.map((section, i) =>
          React.createElement(
            UI.Card,
            { key: i, className: 'overflow-hidden' },
            React.createElement(
              'div',
              { className: 'px-5 py-3 border-b border-cg-border bg-cg-bg-secondary' },
              React.createElement(
                'h2',
                { className: 'text-sm font-semibold text-cg-text' },
                section.title,
              ),
            ),
            React.createElement(
              'div',
              { className: 'p-5' },
              section.render() as React.ReactNode,
            ),
          ),
        ),
      ),
    ),
  );
}
