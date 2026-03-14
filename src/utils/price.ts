/**
 * Utilidades compartidas para formato y validación de precios.
 *
 * Todos los precios en Coongro se almacenan como strings numéricos
 * y se formatean en locale es-AR con 2 decimales.
 */

/** Formatea un string numérico como precio. Retorna placeholder si es nulo/cero/inválido. */
export function formatPrice(value: string | null, placeholder = '—'): string {
  if (!value || value === '0') return placeholder;
  const num = parseFloat(value);
  return isNaN(num) ? placeholder : formatCurrency(num);
}

/** Formatea un número como moneda ($X.XXX,XX en es-AR). */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

/** Filtra caracteres no numéricos de un input de precio (solo dígitos y un punto). */
export function sanitizePrice(value: string): string {
  return value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
}

/** Valida que un string sea un precio válido (vacío, o número >= 0). */
export function isValidPrice(value: string): boolean {
  if (!value) return true;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}
