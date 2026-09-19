// Catégorie d'élément (valeur française canonique de la colonne `categorie`) → classe CSS de couleur
// (voir `.cat-*` dans styles.css). Valeur inconnue / vide : neutre.
const CLASSES: Record<string, string> = {
  'non-métal': 'cat-nonmetal',
  'gaz noble': 'cat-noble',
  'métal alcalin': 'cat-alkali',
  'métal alcalino-terreux': 'cat-alkaline',
  métalloïde: 'cat-metalloid',
  halogène: 'cat-halogen',
  'métal pauvre': 'cat-post',
  'métal de transition': 'cat-transition',
  lanthanide: 'cat-lanthanide',
  actinide: 'cat-actinide',
}

export function categoryClass(category: string): string {
  return CLASSES[category] ?? 'cat-unknown'
}
