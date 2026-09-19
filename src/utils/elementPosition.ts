/** Case d'un élément dans la grille du tableau périodique : 18 colonnes × 7 périodes, puis une ligne vide
 *  (8) et les deux lignes du bloc f (9 = lanthanides, 10 = actinides). */
export interface GridPosition {
  column: number
  row: number
}

/** Position d'un élément d'après son numéro atomique et les colonnes `groupe` / `periode` du jeu de données.
 *  Les lanthanides (57-71) et actinides (89-103) n'ont pas de groupe : ils vont sur les lignes 9 et 10, colonnes 3 à 17.
 *  `null` si la position ne peut pas être déterminée (données manquantes). */
export function elementPosition(z: number, group: number, period: number): GridPosition | null {
  if (Number.isFinite(group) && group > 0 && Number.isFinite(period) && period > 0) return { column: group, row: period }
  if (z >= 57 && z <= 71) return { column: z - 57 + 3, row: 9 }
  if (z >= 89 && z <= 103) return { column: z - 89 + 3, row: 10 }
  return null
}
