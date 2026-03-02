/**
 * Vista de detalle de una consulta.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { ConsultationDetail } from '../../components/ConsultationDetail.js';
import { ConsultationForm } from '../../components/ConsultationForm.js';
import { useConsultationMutations } from '../../hooks/useConsultationMutations.js';
import type { Consultation } from '../../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

export function ConsultationDetailView(props: { consultationId?: string }) {
  const { views, toast } = usePlugin();
  const consultationId =
    props.consultationId ?? (views.params as Record<string, string>)?.consultationId;

  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { softDelete } = useConsultationMutations();

  const handleBack = useCallback(() => {
    views.open('consultations.list.open');
  }, [views]);

  const handleEdit = useCallback((_c: Consultation) => {
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    setRefreshKey((k: number) => k + 1);
    toast.success('Consulta actualizada', 'Los cambios se guardaron correctamente');
  }, [toast]);

  const handleDelete = useCallback(
    (c: Consultation) => {
      if (!confirm('¿Eliminar esta consulta? Se puede restaurar posteriormente.')) return;
      void softDelete(c.id).then(() => {
        views.open('consultations.list.open');
      });
    },
    [softDelete, views]
  );

  const handleNavigate = useCallback(
    (viewId: string, params?: Record<string, unknown>) => {
      views.open(viewId, params);
    },
    [views]
  );

  if (!consultationId) {
    return React.createElement(UI.EmptyState, {
      title: 'No se especificó una consulta',
      className: 'p-6',
    });
  }

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'max-w-6xl mx-auto' },
      React.createElement(ConsultationDetail, {
        key: refreshKey,
        consultationId,
        onBack: handleBack,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onNavigate: handleNavigate,
      })
    ),

    // Modal de edicion
    showEditModal &&
      React.createElement(
        UI.FormDialog,
        {
          open: showEditModal,
          onOpenChange: (open: boolean) => {
            if (!open) setShowEditModal(false);
          },
          title: 'Editar consulta',
          size: 'lg',
        },
        React.createElement(ConsultationForm, {
          consultationId,
          onSuccess: handleEditSuccess,
          onCancel: () => setShowEditModal(false),
        })
      )
  );
}
