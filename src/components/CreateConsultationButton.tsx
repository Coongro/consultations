/**
 * Botón para crear consulta. Abre un FormDialog con PetPicker + ConsultationForm.
 *
 * Modos de uso:
 *   - Sin petId: muestra PetPicker para seleccionar mascota, luego ConsultationForm
 *   - Con petId: abre ConsultationForm directamente
 *   - Modo controlado (open + onOpenChange): no renderiza el botón, el caller controla la apertura
 */
import { PetPicker } from '@coongro/patients';
import type { Pet } from '@coongro/patients';
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { CreateConsultationButtonProps } from '../types/components.js';
import type { Consultation } from '../types/consultation.js';

import { ConsultationForm } from './ConsultationForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

export function CreateConsultationButton(props: CreateConsultationButtonProps) {
  const {
    petId: petIdProp,
    defaults,
    label = 'Nueva consulta',
    onSuccess,
    onCancel,
    variant = 'primary',
    open: openProp,
    onOpenChange,
  } = props;

  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp : openState;

  const [selectedPetId, setSelectedPetId] = useState<string | undefined>(petIdProp);

  const setOpen = useCallback(
    (val: boolean) => {
      if (!isControlled) setOpenState(val);
      onOpenChange?.(val);
    },
    [isControlled, onOpenChange]
  );

  const handleOpen = useCallback(() => {
    setSelectedPetId(petIdProp);
    setOpen(true);
  }, [petIdProp, setOpen]);

  const handleClose = useCallback(() => {
    setSelectedPetId(petIdProp);
    setOpen(false);
    onCancel?.();
  }, [petIdProp, setOpen, onCancel]);

  const handleSuccess = useCallback(
    (c: Consultation) => {
      setSelectedPetId(petIdProp);
      setOpen(false);
      onSuccess?.(c);
    },
    [petIdProp, setOpen, onSuccess]
  );

  return React.createElement(
    React.Fragment,
    null,

    // Botón (solo en modo no controlado)
    !isControlled &&
      React.createElement(
        UI.Button,
        {
          type: 'button',
          variant: variant === 'primary' ? 'brand' : 'outline',
          onClick: handleOpen,
          className: 'gap-2',
        },
        React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 20 }),
        label
      ),

    // Modal
    React.createElement(UI.FormDialog, {
      open,
      onOpenChange: (val: boolean) => {
        if (!val) handleClose();
      },
      title: label,
      size: 'lg',
      children: petIdProp
        ? // Con petId: formulario directo
          React.createElement(ConsultationForm, {
            petId: petIdProp,
            defaults,
            onSuccess: handleSuccess,
            onCancel: handleClose,
          })
        : // Sin petId: PetPicker primero, luego formulario
          React.createElement(
            'div',
            { className: 'flex flex-col gap-4' },
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Paciente *'),
              React.createElement(PetPicker, {
                value: selectedPetId,
                onChange: (pet: Pet | null) => setSelectedPetId(pet?.id),
                placeholder: 'Seleccionar mascota...',
              })
            ),
            selectedPetId
              ? React.createElement(ConsultationForm, {
                  petId: selectedPetId,
                  defaults,
                  onSuccess: handleSuccess,
                  onCancel: handleClose,
                })
              : React.createElement(UI.EmptyState, {
                  title: 'Seleccioná un paciente para continuar',
                })
          ),
    })
  );
}
