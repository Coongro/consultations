import type { Category } from '@coongro/products';

/** Crea un mapa id → name a partir de una lista de categorías. */
export function createCategoryMap(categories: Category[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of categories) map.set(c.id, c.name);
  return map;
}
