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
  const { views } = usePlugin();
  const consultationId =
    props.consultationId ?? (views.params as Record<string, string>)?.consultationId;

  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  }, []);

  const handleDelete = useCallback((_c: Consultation) => {
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!consultationId) return;
    setDeleting(true);
    try {
      await softDelete(consultationId);
      setConfirmDelete(false);
      views.open('consultations.list.open');
    } finally {
      setDeleting(false);
    }
  }, [consultationId, softDelete, views]);

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
      { className: 'w-full' },
      React.createElement(ConsultationDetail, {
        key: refreshKey,
        consultationId,
        onBack: handleBack,
        onEdit: handleEdit,
        onDelete: handleDelete,
      })
    ),

    // Modal de edición con footer sticky
    showEditModal &&
      React.createElement(UI.FormDialogSubmit, {
        open: showEditModal,
        onOpenChange: (open: boolean) => {
          if (!open) setShowEditModal(false);
        },
        title: 'Editar consulta',
        size: 'lg',
        submitLabel: 'Guardar cambios',
        onCancel: () => setShowEditModal(false),
        children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
          React.createElement(ConsultationForm, {
            consultationId,
            onSuccess: handleEditSuccess,
            formRef,
            hideActions: true,
          }),
      }),

    // Confirmar eliminación
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement((UI as any).ConfirmDialog, {
      open: confirmDelete,
      onOpenChange: setConfirmDelete,
      title: 'Eliminar consulta',
      description: '¿Eliminar esta consulta?',
      confirmLabel: 'Eliminar',
      loading: deleting,
      onConfirm: () => void handleConfirmDelete(),
    })
  );
}
