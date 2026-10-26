// Génère src/data/elements.i18n.ts : traductions du jeu de données (sidecar) — noms d'éléments FR → EN / ES / NL / HT,
// catégories, états, articles espagnols, libellés de colonnes.
//   · EN : PubChem (orthographe IUPAC pour aluminium/césium). Sans argument, on reprend les noms EN du fichier déjà généré.
//   · ES / NL / HT : scripts/elements-names.mjs (par symbole).
// Usage : node scripts/build-elements-i18n.mjs [<pubchem.csv>]
import fs from 'node:fs'
import { ES_FEMININE, NAMES } from './elements-names.mjs'

const OUT = new URL('../src/data/elements.i18n.ts', import.meta.url)
const rows = fs.readFileSync(new URL('../src/data/elements.csv', import.meta.url), 'utf8').trim().split(/\r?\n/).slice(1).map((line) => line.split(';'))
const namesFr = rows.map((cells) => cells[0])
const symbols = rows.map((cells) => cells[2])

const q = (s) => `'${s.replace(/'/g, "\\'")}'`
const key = (s) => (/^[A-Za-z_$][\w$]*$/.test(s) ? s : q(s))

// — noms anglais —
let namesEn
const SRC = process.argv[2]
if (SRC) {
  const pub = fs.readFileSync(SRC, 'utf8').trim().split(/\r?\n/).slice(1).map((line) => line.split(',')[2].replace(/"/g, ''))
  const IUPAC = { Aluminum: 'Aluminium', Cesium: 'Caesium' }
  namesEn = pub.map((n) => IUPAC[n] ?? n)
  if (namesEn.length !== namesFr.length) throw new Error(`Longueurs différentes : ${namesEn.length} / ${namesFr.length}`)
} else {
  // Reprend les « { en: '…' } » de la section « noms d'éléments » du fichier existant ; l'absence = identique au français.
  const existing = fs.readFileSync(OUT, 'utf8').split(/\r?\n/)
  const start = existing.findIndex((line) => line.includes("— noms d'éléments —"))
  const end = existing.findIndex((line) => line.includes('— catégories —'))
  if (start < 0 || end < start) throw new Error('Section des noms introuvable dans elements.i18n.ts')
  const known = new Map()
  for (const line of existing.slice(start + 1, end)) {
    const m = line.match(/^\s*(?:'((?:\\'|[^'])+)'|([\w$]+)):\s*\{[^}]*?\ben:\s*'((?:\\'|[^'])*)'/)
    if (m) known.set((m[1] ?? m[2]).replace(/\\'/g, "'"), m[3].replace(/\\'/g, "'"))
  }
  namesEn = namesFr.map((fr) => known.get(fr) ?? fr)
}

// — es / nl / ht : un nom par symbole, toutes les langues complètes —
for (const locale of ['es', 'nl', 'ht']) {
  const missing = symbols.filter((symbol) => !NAMES[locale][symbol])
  const extra = Object.keys(NAMES[locale]).filter((symbol) => !symbols.includes(symbol))
  if (missing.length || extra.length) throw new Error(`${locale} : manquants ${missing.join(',')} / en trop ${extra.join(',')}`)
}

const lines = []
namesFr.forEach((fr, i) => {
  const parts = []
  if (namesEn[i] !== fr) parts.push(`en: ${q(namesEn[i])}`)
  for (const locale of ['es', 'nl', 'ht']) {
    const name = NAMES[locale][symbols[i]]
    if (name !== fr) parts.push(`${locale}: ${q(name)}`)
  }
  if (parts.length) lines.push(`  ${key(fr)}: { ${parts.join(', ')} },`)
})

const articlesEs = namesFr.map((fr, i) => `  ${key(fr)}: { es: '${ES_FEMININE.has(symbols[i]) ? 'la' : 'el'}' },`)

const out = `import type { DataI18n } from '@engine'

// Traductions du jeu de données des éléments. Source = \`elements.csv\` (français). On ne liste que ce
// qui diffère réellement du français. Locales : en, es, nl, ht (le créole : première version, à faire relire
// par un locuteur natif). Généré par scripts/build-elements-i18n.mjs (noms : scripts/elements-names.mjs ;
// catégories / états / libellés : maintenus dans le générateur).

const values: DataI18n['values'] = {
  // — noms d'éléments —
${lines.join('\n')}

  // — catégories —
  'non-métal': { en: 'nonmetal', es: 'no metal', nl: 'niet-metaal', ht: 'non-metal' },
  'gaz noble': { en: 'noble gas', es: 'gas noble', nl: 'edelgas', ht: 'gaz nòb' },
  'métal alcalin': { en: 'alkali metal', es: 'metal alcalino', nl: 'alkalimetaal', ht: 'metal alkalen' },
  'métal alcalino-terreux': { en: 'alkaline earth metal', es: 'metal alcalinotérreo', nl: 'aardalkalimetaal', ht: 'metal alkalino-terè' },
  métalloïde: { en: 'metalloid', es: 'metaloide', nl: 'metalloïde', ht: 'metaloyid' },
  halogène: { en: 'halogen', es: 'halógeno', nl: 'halogeen', ht: 'alojèn' },
  'métal pauvre': { en: 'post-transition metal', es: 'metal postransicional', nl: 'post-overgangsmetaal', ht: 'metal pòs-tranzisyon' },
  'métal de transition': { en: 'transition metal', es: 'metal de transición', nl: 'overgangsmetaal', ht: 'metal tranzisyon' },
  lanthanide: { en: 'lanthanide', es: 'lantánido', nl: 'lanthanide', ht: 'lantanid' },
  actinide: { en: 'actinide', es: 'actínido', nl: 'actinide', ht: 'aktinid' },

  // — états —
  solide: { en: 'solid', es: 'sólido', nl: 'vast', ht: 'solid' },
  liquide: { en: 'liquid', es: 'líquido', nl: 'vloeibaar', ht: 'likid' },
  gaz: { en: 'gas', es: 'gas', nl: 'gas', ht: 'gaz' },
}

// Article de tête : le français vient de la colonne \`article\` du CSV ; l'anglais, le néerlandais et le créole n'en
// portent pas devant un nom d'élément. L'espagnol dit « el hierro » / « la plata » (d'où « del hierro », « de la plata »).
const articles: DataI18n['articles'] = {
${articlesEs.join('\n')}
}

const columnLabels: DataI18n['columnLabels'] = {
  symbole: { en: 'symbol', es: 'símbolo', nl: 'symbool', ht: 'senbòl' },
  'numero atomique': { fr: 'numéro atomique', en: 'atomic number', es: 'número atómico', nl: 'atoomnummer', ht: 'nimewo atomik' },
  'masse atomique': { en: 'atomic mass', es: 'masa atómica', nl: 'atoommassa', ht: 'mas atomik' },
  categorie: { fr: 'catégorie', en: 'category', es: 'categoría', nl: 'categorie', ht: 'kategori' },
  groupe: { en: 'group', es: 'grupo', nl: 'groep', ht: 'gwoup' },
  periode: { fr: 'période', en: 'period', es: 'período', nl: 'periode', ht: 'peryòd' },
  etat: { fr: 'état (à température ambiante)', en: 'state (at room temperature)', es: 'estado (a temperatura ambiente)', nl: 'toestand (bij kamertemperatuur)', ht: 'eta (a tanperati anbyant)' },
  electronegativite: { fr: 'électronégativité', en: 'electronegativity', es: 'electronegatividad', nl: 'elektronegativiteit', ht: 'elektwonegativite' },
  'point fusion': { fr: 'point de fusion', en: 'melting point', es: 'punto de fusión', nl: 'smeltpunt', ht: 'pwen fizyon' },
  'point ebullition': { fr: "point d'ébullition", en: 'boiling point', es: 'punto de ebullición', nl: 'kookpunt', ht: 'pwen bouyi' },
  'masse volumique': { en: 'density', es: 'densidad', nl: 'dichtheid', ht: 'dansite' },
  'annee decouverte': { fr: 'année de découverte', en: 'year of discovery', es: 'año de descubrimiento', nl: 'jaar van ontdekking', ht: 'ane dekouvèt' },
  'configuration electronique': { fr: 'configuration électronique', en: 'electron configuration', es: 'configuración electrónica', nl: 'elektronenconfiguratie', ht: 'konfigirasyon elektwonik' },
  'etats oxydation': { fr: "états d'oxydation", en: 'oxidation states', es: 'estados de oxidación', nl: 'oxidatietoestanden', ht: 'eta oksidasyon' },
}

export const elementsI18n: DataI18n = { values, articles, columnLabels, commonNouns: true }
`
fs.writeFileSync(OUT, out)
console.log('elements.i18n.ts écrit :', namesFr.length, 'éléments,', lines.length, 'noms traduits')
