// --- View Override ---
// Overrides: patients.detail.open (from plugin: patients)
// Importa PetDetail de @coongro/patients y agrega extraSections/extraActions de consultas.

import { PetDetail, PetForm } from '@coongro/patients';
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

  const handleDelete = useCallback(
    (pet: Pet) => {
      toast.warning('Confirmar', `¿Eliminar a ${pet.name}?`);
    },
    [toast]
  );

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
        }),
    },
  ];

  // Acciones extra: boton "Nueva Consulta"
  const extraActions = [
    {
      label: 'Nueva Consulta',
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

    // Modal de edicion de paciente
    showEditModal &&
      React.createElement(UI.FormDialog, {
        open: showEditModal,
        onOpenChange: (open: boolean) => {
          if (!open) setShowEditModal(false);
        },
        title: 'Editar paciente',
        size: 'lg',
        children: React.createElement(PetForm, {
          petId,
          onSuccess: handleEditSuccess,
          onCancel: () => setShowEditModal(false),
        }),
      }),

    React.createElement(CreateConsultationButton, {
      petId,
      open: showConsultationModal,
      onOpenChange: setShowConsultationModal,
      onSuccess: handleConsultationSuccess,
    })
  );
}
