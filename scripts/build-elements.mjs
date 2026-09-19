// Génère src/data/elements.csv (118 éléments, français canonique, séparateur « ; ») à partir du
// tableau périodique PubChem (NCBI, données libres de droits) + noms français saisis ici.
// Usage : node scripts/build-elements.mjs <chemin/vers/pubchem.csv>
//   curl -o pubchem.csv "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV"
import fs from 'node:fs'

const SRC = process.argv[2]
if (!SRC) throw new Error('Usage : node scripts/build-elements.mjs <pubchem.csv>')
const OUT = new URL('../src/data/elements.csv', import.meta.url)

const NAMES_FR = 'Hydrogène,Hélium,Lithium,Béryllium,Bore,Carbone,Azote,Oxygène,Fluor,Néon,Sodium,Magnésium,Aluminium,Silicium,Phosphore,Soufre,Chlore,Argon,Potassium,Calcium,Scandium,Titane,Vanadium,Chrome,Manganèse,Fer,Cobalt,Nickel,Cuivre,Zinc,Gallium,Germanium,Arsenic,Sélénium,Brome,Krypton,Rubidium,Strontium,Yttrium,Zirconium,Niobium,Molybdène,Technétium,Ruthénium,Rhodium,Palladium,Argent,Cadmium,Indium,Étain,Antimoine,Tellure,Iode,Xénon,Césium,Baryum,Lanthane,Cérium,Praséodyme,Néodyme,Prométhium,Samarium,Europium,Gadolinium,Terbium,Dysprosium,Holmium,Erbium,Thulium,Ytterbium,Lutécium,Hafnium,Tantale,Tungstène,Rhénium,Osmium,Iridium,Platine,Or,Mercure,Thallium,Plomb,Bismuth,Polonium,Astate,Radon,Francium,Radium,Actinium,Thorium,Protactinium,Uranium,Neptunium,Plutonium,Américium,Curium,Berkélium,Californium,Einsteinium,Fermium,Mendélévium,Nobélium,Lawrencium,Rutherfordium,Dubnium,Seaborgium,Bohrium,Hassium,Meitnérium,Darmstadtium,Roentgenium,Copernicium,Nihonium,Flérovium,Moscovium,Livermorium,Tennesse,Oganesson'.split(',')

const CATEGORY_FR = {
  Nonmetal: 'non-métal', 'Noble gas': 'gaz noble', 'Alkali metal': 'métal alcalin',
  'Alkaline earth metal': 'métal alcalino-terreux', Metalloid: 'métalloïde', Halogen: 'halogène',
  'Post-transition metal': 'métal pauvre', 'Transition metal': 'métal de transition',
  Lanthanide: 'lanthanide', Actinide: 'actinide',
}
const STATE_FR = { Solid: 'solide', Liquid: 'liquide', Gas: 'gaz' }

// Groupe (colonne du tableau, 1-18) ; les lanthanides/actinides n'ont pas de groupe.
function groupOf(z) {
  if (z === 1) return 1
  if (z === 2) return 18
  const rules = [[3, 4, 1], [5, 10, 13], [11, 12, 1], [13, 18, 13], [19, 20, 1], [21, 30, 3], [31, 36, 13],
    [37, 38, 1], [39, 48, 3], [49, 54, 13], [55, 56, 1], [72, 80, 4], [81, 86, 13],
    [87, 88, 1], [104, 112, 4], [113, 118, 13]]
  for (const [from, to, first] of rules) if (z >= from && z <= to) return first + (z - from)
  return ''
}
const periodOf = (z) => (z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7)

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const cells = []
    let cur = ''; let q = false
    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) { cells.push(cur); cur = '' } else cur += ch
    }
    cells.push(cur)
    return cells
  })
}

const [head, ...body] = parseCsv(fs.readFileSync(SRC, 'utf8'))
const idx = Object.fromEntries(head.map((h, i) => [h, i]))
const num = (s) => { const n = Number(String(s ?? '').replace(/[\[\]]/g, '')); return Number.isFinite(n) && String(s ?? '').trim() !== '' ? n : null }
const kToC = (k) => (num(k) == null ? '' : String(Math.round((num(k) - 273.15) * 100) / 100))

const outHead = ['element', 'article', 'symbole', 'numero_atomique', 'masse_atomique_u', 'categorie', 'groupe', 'periode', 'etat',
  'electronegativite', 'point_fusion_c', 'point_ebullition_c', 'masse_volumique_g_cm3', 'annee_decouverte', 'configuration_electronique', 'etats_oxydation']

// PubChem : suffixes « (calculated) » / « (predicted) » et espacement irrégulier après le gaz noble.
const cleanConfig = (c) => c.replace(/\s*\((?:calculated|predicted)\)/i, '').replace(/\]\s+/, ']').trim()

const rows = body.map((r) => {
  const z = Number(r[idx.AtomicNumber])
  const name = NAMES_FR[z - 1]
  const state = STATE_FR[r[idx.StandardState]] ?? ''
  const block = r[idx.GroupBlock]
  const category = CATEGORY_FR[block] ?? (z >= 109 ? 'propriétés inconnues' : '')
  const year = /^\d+$/.test(r[idx.YearDiscovered]) ? r[idx.YearDiscovered] : ''
  const density = state === 'solide' || state === 'liquide' ? String(num(r[idx.Density]) ?? '') : ''
  // PubChem arrondit Li et Pb (7.0 / 207) : valeurs IUPAC usuelles
  const mass = ({ 3: 6.94, 82: 207.2 })[z] ?? num(r[idx.AtomicMass])
  return [
    name, /^[AEIOUHÉaeiouhé]/.test(name) ? "l'" : 'le', r[idx.Symbol], String(z), mass == null ? '' : String(mass),
    category, String(groupOf(z)), String(periodOf(z)), state, r[idx.Electronegativity],
    kToC(r[idx.MeltingPoint]), kToC(r[idx.BoilingPoint]), density, year, cleanConfig(r[idx.ElectronConfiguration]),
    r[idx.OxidationStates].split(',').map((v) => v.trim()).filter(Boolean).map((v) => (/^\d/.test(v) && v !== '0' ? `+${v}` : v)).join('|'),
  ]
})

rows.sort((a, b) => Number(a[3]) - Number(b[3]))
fs.writeFileSync(OUT, [outHead, ...rows].map((r) => r.join(';')).join('\n') + '\n')
console.log('elements.csv écrit :', rows.length, 'éléments')
