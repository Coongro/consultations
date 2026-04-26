// --- Override de Vista ---
// Reemplaza: patients.detail.open (del plugin: patients)
// Importa PetDetail de @coongro/patients y agrega extraSections/extraActions de consultas.

import { PetDetail, PetForm, usePetMutations } from '@coongro/patients';
import type { Pet } from '@coongro/patients';
import { getHostReact, getHostUI, usePlugin, actions } from '@coongro/plugin-sdk';

import { ConsultationTimeline } from '../../components/ConsultationTimeline.js';
import { CreateConsultationButton } from '../../components/CreateConsultationButton.js';
import { useConsultationsByPet } from '../../hooks/useConsultationsByPet.js';
import { useConsultationsSettings } from '../../hooks/useConsultationsSettings.js';
import type { Consultation } from '../../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback, useState, useEffect, useRef } = React;

export function DetailOverrideView(props: { petId?: string }) {
  const { views, toast } = usePlugin();
  const petId = props.petId ?? (views.params as Record<string, string>)?.petId;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Pet | null>(null);
  const { softDelete, deleting } = usePetMutations();

  // Fetch de totales de servicios para pasar al timeline
  const { settings: consultSettings } = useConsultationsSettings();
  const { consultations: timelineConsultations } = useConsultationsByPet({ petId, limit: 5 });
  const [totalsMap, setTotalsMap] = useState<Record<string, number>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!consultSettings.showPrices || timelineConsultations.length === 0) return;
    const ids = timelineConsultations.map((c: Consultation) => c.id);
    void (async () => {
      try {
        const result = await actions.execute<Record<string, number>>(
          'consultations.services.totalsByConsultations',
          { consultationIds: ids }
        );
        if (mountedRef.current) setTotalsMap(result ?? {});
      } catch {
        // Silencioso
      }
    })();
  }, [timelineConsultations, consultSettings.showPrices]);

  const handleBack = useCallback(() => {
    views.open('patients.list.open');
  }, [views]);

  const handleEdit = useCallback((_pet: Pet) => {
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    setRefreshKey((k: number) => k + 1);
    toast.success('Paciente actualizado', 'Los datos se guardaron correctamente');
  }, [toast]);

  const handleConsultationSuccess = useCallback(
    (c: Consultation) => {
      setRefreshKey((k: number) => k + 1);
      views.open('consultations.detail.open', { consultationId: c.id });
    },
    [views]
  );

  const handleDelete = useCallback((pet: Pet) => {
    setConfirmDelete(pet);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const ok = await softDelete(confirmDelete.id);
    if (ok) {
      setConfirmDelete(null);
      views.open('patients.list.open');
    }
  }, [confirmDelete, softDelete, views]);

  const handleNavigate = useCallback(
    (viewId: string, params?: Record<string, unknown>) => {
      views.open(viewId, params);
    },
    [views]
  );

  if (!petId) {
    return React.createElement(UI.EmptyState, {
      title: 'No se especificó un paciente',
      className: 'p-6',
    });
  }

  // Secciones extra: timeline de consultas
  const extraSections = [
    {
      title: 'Historial clínico',
      order: 10,
      render: () =>
        React.createElement(ConsultationTimeline, {
          petId,
          limit: 5,
          totalsMap,
          onConsultationClick: (c: Consultation) =>
            views.open('consultations.detail.open', { consultationId: c.id }),
          onViewAll: () => views.open('consultations.list.open'),
        }),
    },
  ];

  // Acciones extra: boton "Nueva Consulta"
  const extraActions = [
    {
      label: 'Nueva Consulta',
      icon: 'Plus',
      onClick: () => setShowConsultationModal(true),
    },
  ];

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'w-full' },
      React.createElement(PetDetail, {
        key: refreshKey,
        petId,
        extraSections,
        extraActions,
        onBack: handleBack,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onNavigate: handleNavigate,
      })
    ),

    // Modal de edición de paciente con footer sticky
    showEditModal &&
      React.createElement(UI.FormDialogSubmit, {
        open: showEditModal,
        onOpenChange: (open: boolean) => {
          if (!open) setShowEditModal(false);
        },
        title: 'Editar paciente',
        size: 'lg',
        submitLabel: 'Guardar cambios',
        onCancel: () => setShowEditModal(false),
        children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
          React.createElement(PetForm, {
            petId,
            onSuccess: handleEditSuccess,
            formRef,
            hideActions: true,
          }),
      }),

    React.createElement(CreateConsultationButton, {
      petId,
      open: showConsultationModal,
      onOpenChange: setShowConsultationModal,
      onSuccess: handleConsultationSuccess,
    }),

    // Confirmar eliminación
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement((UI as any).ConfirmDialog, {
      open: !!confirmDelete,
      onOpenChange: (open: boolean) => {
        if (!open) setConfirmDelete(null);
      },
      title: 'Eliminar paciente',
      description: confirmDelete
        ? React.createElement(
            React.Fragment,
            null,
            '¿Eliminar a ',
            React.createElement('strong', null, confirmDelete.name),
            '?'
          )
        : '',
      confirmLabel: 'Eliminar',
      loading: deleting,
      onConfirm: () => void handleConfirmDelete(),
    })
  );
}
