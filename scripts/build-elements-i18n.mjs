// Génère src/data/elements.i18n.ts : traductions du jeu de données (sidecar) — noms d'éléments FR → EN
// (depuis PubChem, orthographe IUPAC pour aluminium/césium), catégories, états, libellés de colonnes.
// Usage : node scripts/build-elements-i18n.mjs <pubchem.csv>
import fs from 'node:fs'

const SRC = process.argv[2]
if (!SRC) throw new Error('Usage : node scripts/build-elements-i18n.mjs <pubchem.csv>')
const csv = fs.readFileSync(new URL('../src/data/elements.csv', import.meta.url), 'utf8').trim().split('\n').slice(1)
const namesFr = csv.map((line) => line.split(';')[0])

const pub = fs.readFileSync(SRC, 'utf8').trim().split(/\r?\n/).slice(1).map((line) => line.split(',')[2].replace(/"/g, ''))
const IUPAC = { Aluminum: 'Aluminium', Cesium: 'Caesium' }
const namesEn = pub.map((n) => IUPAC[n] ?? n)
if (namesEn.length !== namesFr.length) throw new Error(`Longueurs différentes : ${namesEn.length} / ${namesFr.length}`)

const q = (s) => `'${s.replace(/'/g, "\\'")}'`
const names = namesFr.map((fr, i) => (fr === namesEn[i] ? null : `  ${/^[A-Za-z_$][\w$]*$/.test(fr) ? fr : q(fr)}: { en: ${q(namesEn[i])} },`)).filter(Boolean).join('\n')

const out = `import type { DataI18n } from '@engine'

// Traductions du jeu de données des éléments. Source = \`elements.csv\` (français). On ne liste que ce
// qui diffère réellement du français. Locales : en. Les autres (es / nl / ht) retombent sur le français
// pour les données — seuls les libellés de l'interface sont traduits. Généré par
// scripts/build-elements-i18n.mjs (noms) ; catégories / états / libellés maintenus à la main.

const values: DataI18n['values'] = {
  // — noms d'éléments —
${names}

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

// Article de tête : les noms d'éléments n'en portent pas en anglais (l'article FR vient de la colonne \`article\`).
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
`
fs.writeFileSync(new URL('../src/data/elements.i18n.ts', import.meta.url), out)
console.log('elements.i18n.ts écrit :', namesFr.length, 'éléments')
