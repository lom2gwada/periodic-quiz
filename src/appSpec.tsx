import { HoverPreview, applySchemaConfig, createRemoteDataset, inferSchema, useT } from '@engine'
import type { Dataset, FicheDecorator, QuizAppSpec, Row, SchemaConfig, SpeechTemplates } from '@engine'
import elementsCsv from './data/elements.csv?raw'
import { elementsI18n } from './data/elements.i18n'
import { PeriodicBackground } from './components/PeriodicBackground'
import { MiniPeriodicTable } from './components/MiniPeriodicTable'
import { PeriodicTablePage } from './components/PeriodicTablePage'
import { categoryClass } from './utils/elementCategory'
import { elementPosition } from './utils/elementPosition'

/** Colonnes symbole / numéro / catégorie / groupe / période (tuiles de fiche et vue Tableau) : le jeu
 *  de données embarqué en a, un CSV importé non. */
const COLUMNS = { symbol: 'symbole', number: 'numero_atomique', category: 'categorie', group: 'groupe', period: 'periode' }

// Mêmes clés/ordre que les en-têtes de src/data/elements.csv — la table Supabase en est un miroir
// éditable (colonne par colonne, tout en texte), pour corriger une donnée sans redéployer l'appli.
const remote = createRemoteDataset({
  rows: 'elements',
  key: 'element',
  schema: 'schema',
  columns: [
    'element', 'article', 'symbole', 'numero_atomique', 'masse_atomique_u', 'categorie', 'groupe', 'periode',
    'etat', 'electronegativite', 'point_fusion_c', 'point_ebullition_c', 'masse_volumique_g_cm3',
    'annee_decouverte', 'configuration_electronique', 'etats_oxydation',
  ],
})

/** Ce que le bouton « Écouter » d'une fiche déclame (syntaxe : voir `SpeechTemplates` dans le moteur). Une phrase saute
 *  quand la donnée manque (pas de masse volumique pour un gaz, pas de date de découverte pour les éléments antiques…).
 *  Français et anglais, les seules langues où les noms d'éléments sont traduits ; les autres langues sont lues en
 *  français. Unités écrites en toutes lettres. Volontairement absents : configuration électronique et états
 *  d'oxydation (« [Ar]4s2 3d6 », « +2|+3 ») que la voix lirait mal. */
const speech: SpeechTemplates = {
  fr: [
    '{Name}, symbole {symbole}, numéro atomique {numero_atomique}.',
    'C’est un élément de la catégorie {categorie}.',
    'Il se situe à la période {periode}[ et au groupe {groupe}].',
    'Sa masse atomique est de {masse_atomique_u} unités de masse atomique.',
    'À température ambiante, c’est un {etat}.',
    'Son électronégativité est de {electronegativite}.',
    'Son point de fusion est de {point_fusion_c} degrés Celsius.',
    'Son point d’ébullition est de {point_ebullition_c} degrés Celsius.',
    'Sa masse volumique est de {masse_volumique_g_cm3} grammes par centimètre cube.',
    'Il a été découvert en {annee_decouverte}.',
  ],
  en: [
    '{Name}, symbol {symbole}, atomic number {numero_atomique}.',
    'Its category is {categorie}.',
    'It sits in period {periode}[ and group {groupe}].',
    'Its atomic mass is {masse_atomique_u} atomic mass units.',
    'At room temperature, it is a {etat}.',
    'Its electronegativity is {electronegativite}.',
    'Its melting point is {point_fusion_c} degrees Celsius.',
    'Its boiling point is {point_ebullition_c} degrees Celsius.',
    'Its density is {masse_volumique_g_cm3} grams per cubic centimetre.',
    'It was discovered in {annee_decouverte}.',
  ],
}

// Présentation générale du tableau (bouton « Écouter » de la page d'accueil, pas d'une fiche) :
// origine, principe de classement, grandes familles. `{COUNT}` est remplacé par le nombre réel
// d'éléments (`buildIntro`) pour ne pas se désynchroniser du CSV. Français et anglais seulement,
// comme `speech` ci-dessus (les autres langues n'ont pas de noms d'éléments traduits).
const introTemplate: SpeechTemplates = {
  fr: [
    "Le tableau périodique classe tous les éléments chimiques connus, du plus léger à l'atome le plus lourd jamais synthétisé.",
    'Il a été imaginé en 1869 par le chimiste russe Dmitri Mendeleïev, qui avait remarqué que les propriétés des éléments se répètent selon un motif régulier.',
    'Chaque élément y est rangé par numéro atomique croissant — le nombre de protons dans son noyau.',
    "Les lignes s'appellent des périodes, les colonnes des groupes : deux éléments d'un même groupe partagent souvent des propriétés chimiques proches.",
    'Le tableau distingue aussi de grandes familles, comme les métaux, les non-métaux, les métalloïdes ou les gaz nobles.',
    "Certains éléments existent depuis la formation de la Terre ; d'autres n'ont été créés qu'en laboratoire, parfois quelques atomes à la fois.",
    "Aujourd'hui, {COUNT} éléments sont officiellement reconnus par l'Union internationale de chimie pure et appliquée.",
    'Ce quiz explore chacun d’eux : son symbole, sa masse, sa catégorie, et bien plus encore.',
  ],
  en: [
    'The periodic table organizes every known chemical element, from the lightest to the heaviest atom ever synthesized.',
    'It was devised in 1869 by the Russian chemist Dmitri Mendeleev, who noticed that elements’ properties repeat in a regular pattern.',
    'Each element is placed in order of increasing atomic number — the number of protons in its nucleus.',
    'Rows are called periods, columns are called groups: two elements in the same group often share similar chemical properties.',
    'The table also distinguishes broad families, such as metals, nonmetals, metalloids, and noble gases.',
    'Some elements have existed since the Earth formed; others have only ever been created in a laboratory, sometimes just a few atoms at a time.',
    'Today, {COUNT} elements are officially recognized by the International Union of Pure and Applied Chemistry.',
    'This quiz explores each of them: its symbol, its mass, its category, and much more.',
  ],
}

const buildIntro = (count: number): SpeechTemplates => Object.fromEntries(
  Object.entries(introTemplate).map(([loc, sentences]) => [loc, (sentences ?? []).map((s) => s.replace('{COUNT}', String(count)))]),
) as SpeechTemplates

/** Mini tableau périodique (élément courant coloré), agrandi au survol. */
function TablePosition({ row, name }: { row: Row; name: string }) {
  const t = useT()
  const position = elementPosition(Number(row[COLUMNS.number]), Number(row[COLUMNS.group]), Number(row[COLUMNS.period]))
  const category = row[COLUMNS.category] ?? ''
  return (
    <HoverPreview
      className="fiche-table-wrap"
      label={t('fiche.tableLabel', { name })}
      trigger={<MiniPeriodicTable position={position} category={category} symbol={row[COLUMNS.symbol]} className="fiche-table" />}
      preview={<MiniPeriodicTable position={position} category={category} symbol={row[COLUMNS.symbol]} />}
    />
  )
}

/** Tuile symbole/numéro à gauche du nom, mini tableau périodique à droite. */
const ficheDecor: FicheDecorator = (row, { name }) => ({
  trail: <TablePosition row={row} name={name} />,
  lead: (
    <span className={`element-tile fiche-tile ${categoryClass(row[COLUMNS.category] ?? '')}`} aria-hidden="true">
      <span className="element-number">{row[COLUMNS.number]}</span>
      <span className="element-symbol">{row[COLUMNS.symbol]}</span>
    </span>
  ),
})

/** Construit le jeu de données des éléments à partir de lignes CSV — même forme que les lignes
 *  viennent du fichier embarqué (démarrage) ou de Supabase (bascule silencieuse une fois le fetch
 *  arrivé) : elements.i18n.ts reste du code statique, indexé par le nom français exact des
 *  éléments et certaines valeurs de cellules (catégories, états). */
function buildDataset(rows: Row[], schemaConfig: SchemaConfig | null): Dataset {
  const baseSchema = { ...inferSchema(rows), noun: 'élément', title: 'Le tableau périodique des éléments' }
  const schema = applySchemaConfig(baseSchema, schemaConfig)
  return {
    rows,
    schema,
    i18n: elementsI18n,
    nouns: { fr: 'élément', en: 'element', es: 'elemento', nl: 'element', ht: 'eleman' },
    titles: {
      fr: 'Le tableau périodique des éléments',
      en: 'The periodic table of elements',
      es: 'La tabla periódica de los elementos',
      nl: 'Het periodiek systeem der elementen',
    },
    editable: true,
    ficheDecor,
    speech,
    intro: buildIntro(rows.length),
    // « Cliquez sur X » : tous les éléments qui ont une case sur le tableau (position lue dans groupe/période).
    map: {
      kind: 'table',
      targets: rows
        .filter((row) => elementPosition(Number(row[COLUMNS.number]), Number(row[COLUMNS.group]), Number(row[COLUMNS.period])))
        .map((row) => row[schema.subjectColumn] ?? ''),
      render: ({ selected, onPick }) => (
        <PeriodicTablePage rows={rows} schema={schema} i18n={elementsI18n} tile={COLUMNS} groupColumn={COLUMNS.group} periodColumn={COLUMNS.period} pick={{ selected, onPick }} />
      ),
    },
    views: [{
      id: 'table',
      icon: '🧪',
      labelKey: 'nav.table',
      entry: 'start',
      render: ({ dataset, openFiche, back }) => (
        <PeriodicTablePage rows={dataset.rows} schema={dataset.schema} i18n={dataset.i18n} tile={COLUMNS} groupColumn={COLUMNS.group} periodColumn={COLUMNS.period} onOpenFiche={openFiche} onBack={back} />
      ),
    }],
  }
}

export const appSpec: QuizAppSpec = {
  seed: 'elements',
  fallbackTitle: 'Periodic Quiz',
  bundledCsv: elementsCsv,
  buildDataset,
  remote,
  Background: PeriodicBackground,
}
