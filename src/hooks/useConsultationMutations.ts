/**
 * Hook para operaciones de mutacion de consultas (crear, editar, eliminar).
 * Al crear, maneja la creacion atomica de medicamentos.
 */
import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';

import type {
  Consultation,
  ConsultationCreateData,
  ConsultationUpdateData,
} from '../types/consultation.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UseConsultationMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: ConsultationCreateData) => Promise<Consultation | null>;
  update: (id: string, data: ConsultationUpdateData) => Promise<Consultation | null>;
  softDelete: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
}

export function useConsultationMutations(): UseConsultationMutationsResult {
  const { toast } = usePlugin();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(
    async (data: ConsultationCreateData): Promise<Consultation | null> => {
      setCreating(true);
      try {
        const { medications, services, ...consultationData } = data;

        // Crear consulta
        const result = await actions.execute<Consultation[]>('consultations.records.create', {
          data: consultationData,
        });
        const consultation = result[0];
        if (!consultation) throw new Error('No se pudo crear la consulta');

        // Crear medicamentos y servicios en paralelo
        const promises: Promise<unknown>[] = [];

        if (medications && medications.length > 0) {
          promises.push(
            ...medications.map((med) =>
              actions.execute('consultations.medications.create', {
                data: { ...med, consultation_id: consultation.id },
              })
            )
          );
        }

        if (services && services.length > 0) {
          promises.push(
            ...services.map((svc) =>
              actions.execute('consultations.services.create', {
                data: {
                  consultation_id: consultation.id,
                  product_id: svc.product_id ?? null,
                  product_name: svc.product_name,
                  quantity: svc.quantity,
                  unit_price: svc.unit_price,
                  subtotal: svc.subtotal,
                  notes: svc.notes ?? null,
                },
              })
            )
          );
        }

        if (promises.length > 0) await Promise.all(promises);

        toast.success('Consulta registrada', data.reason);
        return consultation;
      } catch (err) {
        toast.error(
          'Error',
          err instanceof Error ? err.message : 'No se pudo registrar la consulta'
        );
        return null;
      } finally {
        setCreating(false);
      }
    },
    [toast]
  );

  const update = useCallback(
    async (id: string, data: ConsultationUpdateData): Promise<Consultation | null> => {
      setUpdating(true);
      try {
        const { services, ...updateData } = data;
        const result = await actions.execute<Consultation[]>('consultations.records.update', {
          id,
          data: updateData,
        });

        // Reemplazar service lines si se proporcionan
        if (services !== undefined) {
          await actions.execute('consultations.services.deleteByConsultation', {
            consultationId: id,
          });
          if (services.length > 0) {
            await Promise.all(
              services.map((svc) =>
                actions.execute('consultations.services.create', {
                  data: {
                    consultation_id: id,
                    product_id: svc.product_id ?? null,
                    product_name: svc.product_name,
                    quantity: svc.quantity,
                    unit_price: svc.unit_price,
                    subtotal: svc.subtotal,
                    notes: svc.notes ?? null,
                  },
                })
              )
            );
          }
        }

        toast.success('Consulta actualizada', '');
        return result[0] ?? null;
      } catch (err) {
        toast.error(
          'Error',
          err instanceof Error ? err.message : 'No se pudo actualizar la consulta'
        );
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  const softDelete = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('consultations.records.softDelete', { id });
        toast.success('Consulta archivada', '');
        return true;
      } catch (err) {
        toast.error(
          'Error',
          err instanceof Error ? err.message : 'No se pudo archivar la consulta'
        );
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const restore = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await actions.execute('consultations.records.restore', { id });
        toast.success('Consulta restaurada', '');
        return true;
      } catch (err) {
        toast.error(
          'Error',
          err instanceof Error ? err.message : 'No se pudo restaurar la consulta'
        );
        return false;
      }
    },
    [toast]
  );

  return { creating, updating, deleting, create, update, softDelete, restore };
}
