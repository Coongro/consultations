import { actions } from '@coongro/plugin-sdk';

/** Línea de servicio mínima necesaria para generar el cobro. */
export interface BillableServiceLine {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
}

export interface SyncConsultationChargesParams {
  consultationId: string;
  /** Dueño de la mascota (contacto). Si no se resuelve, la cuenta queda sin cliente. */
  contactId: string | null;
  petId: string;
  services: BillableServiceLine[];
}

/**
 * Sincroniza las líneas de servicio de una consulta hacia su "cuenta de atención"
 * (@coongro/billing): abre/reusa la cuenta de la visita (una por consulta) y reemplaza
 * las líneas de tipo 'service' por el set actual. Idempotente y consistente en ediciones
 * (re-guardar la consulta NO duplica el cobro) y no toca otras líneas de la cuenta —
 * ej. vacunas aplicadas en la misma visita.
 *
 * Dependencia BLANDA: si billing no está instalado, la consulta igual quedó registrada;
 * simplemente no se genera el cobro. No interrumpe el flujo clínico.
 */
export async function syncConsultationCharges({
  consultationId,
  contactId,
  petId,
  services,
}: SyncConsultationChargesParams): Promise<void> {
  if (!consultationId || !petId) return;
  try {
    const account = await actions.execute<{ id: string } | undefined>(
      'billing.accounts.openForVisit',
      { contactId: contactId ?? null, petId, consultationId }
    );
    if (!account?.id) return;
    await actions.execute('billing.lines.syncSource', {
      accountId: account.id,
      sourceType: 'service',
      lines: services.map((s) => ({
        productId: s.product_id,
        description: s.product_name,
        quantity: s.quantity,
        unitPrice: s.unit_price,
        subtotal: s.subtotal,
        sourceRef: s.id,
      })),
    });
  } catch {
    /* billing no disponible — la consulta igual quedó registrada */
  }
}
