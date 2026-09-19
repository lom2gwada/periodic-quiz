import type { DataI18n } from '../i18n/data'

// Traductions du jeu de données des éléments. Source = `elements.csv` (français). On ne liste que ce
// qui diffère réellement du français. Locales : en. Les autres (es / nl / ht) retombent sur le français
// pour les données — seuls les libellés de l'interface sont traduits. Généré par
// scripts/build-elements-i18n.mjs (noms) ; catégories / états / libellés maintenus à la main.

const values: DataI18n['values'] = {
  // — noms d'éléments —
  'Hydrogène': { en: 'Hydrogen' },
  'Hélium': { en: 'Helium' },
  'Béryllium': { en: 'Beryllium' },
  Bore: { en: 'Boron' },
  Carbone: { en: 'Carbon' },
  Azote: { en: 'Nitrogen' },
  'Oxygène': { en: 'Oxygen' },
  Fluor: { en: 'Fluorine' },
  'Néon': { en: 'Neon' },
  'Magnésium': { en: 'Magnesium' },
  Silicium: { en: 'Silicon' },
  Phosphore: { en: 'Phosphorus' },
  Soufre: { en: 'Sulfur' },
  Chlore: { en: 'Chlorine' },
  Titane: { en: 'Titanium' },
  Chrome: { en: 'Chromium' },
  'Manganèse': { en: 'Manganese' },
  Fer: { en: 'Iron' },
  Cuivre: { en: 'Copper' },
  'Sélénium': { en: 'Selenium' },
  Brome: { en: 'Bromine' },
  'Molybdène': { en: 'Molybdenum' },
  'Technétium': { en: 'Technetium' },
  'Ruthénium': { en: 'Ruthenium' },
  Argent: { en: 'Silver' },
  'Étain': { en: 'Tin' },
  Antimoine: { en: 'Antimony' },
  Tellure: { en: 'Tellurium' },
  Iode: { en: 'Iodine' },
  'Xénon': { en: 'Xenon' },
  'Césium': { en: 'Caesium' },
  Baryum: { en: 'Barium' },
  Lanthane: { en: 'Lanthanum' },
  'Cérium': { en: 'Cerium' },
  'Praséodyme': { en: 'Praseodymium' },
  'Néodyme': { en: 'Neodymium' },
  'Prométhium': { en: 'Promethium' },
  'Lutécium': { en: 'Lutetium' },
  Tantale: { en: 'Tantalum' },
  'Tungstène': { en: 'Tungsten' },
  'Rhénium': { en: 'Rhenium' },
  Platine: { en: 'Platinum' },
  Or: { en: 'Gold' },
  Mercure: { en: 'Mercury' },
  Plomb: { en: 'Lead' },
  Astate: { en: 'Astatine' },
  'Américium': { en: 'Americium' },
  'Berkélium': { en: 'Berkelium' },
  'Mendélévium': { en: 'Mendelevium' },
  'Nobélium': { en: 'Nobelium' },
  'Meitnérium': { en: 'Meitnerium' },
  'Flérovium': { en: 'Flerovium' },
  Tennesse: { en: 'Tennessine' },

  // — catégories —
  'non-métal': { en: 'nonmetal' },
  'gaz noble': { en: 'noble gas' },
  'métal alcalin': { en: 'alkali metal' },
  'métal alcalino-terreux': { en: 'alkaline earth metal' },
  métalloïde: { en: 'metalloid' },
  halogène: { en: 'halogen' },
  'métal pauvre': { en: 'post-transition metal' },
  'métal de transition': { en: 'transition metal' },
  lanthanide: { en: 'lanthanide' },
  actinide: { en: 'actinide' },

  // — états —
  solide: { en: 'solid' },
  liquide: { en: 'liquid' },
  gaz: { en: 'gas' },
}

// Article de tête : les noms d'éléments n'en portent pas en anglais (l'article FR vient de la colonne `article`).
const articles: DataI18n['articles'] = {}

const columnLabels: DataI18n['columnLabels'] = {
  symbole: { en: 'symbol' },
  'numero atomique': { fr: 'numéro atomique', en: 'atomic number' },
  'masse atomique': { en: 'atomic mass' },
  categorie: { fr: 'catégorie', en: 'category' },
  groupe: { en: 'group' },
  periode: { fr: 'période', en: 'period' },
  etat: { fr: 'état (à température ambiante)', en: 'state (at room temperature)' },
  electronegativite: { fr: 'électronégativité', en: 'electronegativity' },
  'point fusion': { fr: 'point de fusion', en: 'melting point' },
  'point ebullition': { fr: "point d'ébullition", en: 'boiling point' },
  'masse volumique': { en: 'density' },
  'annee decouverte': { fr: 'année de découverte', en: 'year of discovery' },
  'configuration electronique': { fr: 'configuration électronique', en: 'electron configuration' },
  'etats oxydation': { fr: "états d'oxydation", en: 'oxidation states' },
}

export const elementsI18n: DataI18n = { values, articles, columnLabels, commonNouns: true }
