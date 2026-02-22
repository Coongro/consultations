/**
 * Vista de formulario para crear/editar consulta.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { ConsultationForm } from '../../components/ConsultationForm.js';
import type { Consultation } from '../../types/consultation.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback } = React;

export function ConsultationFormView(props: { petId?: string; consultationId?: string }) {
  const { views } = usePlugin();
  const params = views.params as Record<string, string>;
  const petId = props.petId ?? params?.petId;
  const consultationId = props.consultationId ?? params?.consultationId;

  const isEditing = !!consultationId;

  const handleSuccess = useCallback(
    (c: Consultation) => {
      views.open('consultations.detail.open', { consultationId: c.id });
    },
    [views]
  );

  const handleCancel = useCallback(() => {
    if (consultationId) {
      views.open('consultations.detail.open', { consultationId });
    } else if (petId) {
      views.open('patients.detail.open', { petId });
    } else {
      views.open('consultations.list.open');
    }
  }, [views, consultationId, petId]);

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-[var(--cg-bg-secondary)] p-6' },
    React.createElement(
      'div',
      { className: 'max-w-2xl mx-auto' },
      React.createElement(
        'div',
        { className: 'mb-6' },
        React.createElement(
          'h1',
          { className: 'text-2xl font-bold text-[var(--cg-text)]' },
          isEditing ? 'Editar consulta' : 'Nueva consulta'
        ),
        React.createElement(
          'p',
          { className: 'text-sm text-[var(--cg-text-muted)] mt-1' },
          isEditing ? 'Modificar datos de la consulta' : 'Registrar una nueva consulta veterinaria'
        )
      ),
      React.createElement(
        UI.Card,
        { className: 'p-6' },
        React.createElement(ConsultationForm, {
          consultationId,
          petId,
          onSuccess: handleSuccess,
          onCancel: handleCancel,
        })
      )
    )
  );
}
