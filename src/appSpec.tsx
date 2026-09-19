import { applySchemaConfig, createRemoteDataset, inferSchema } from '@engine'
import type { Dataset, FicheDecorator, QuizAppSpec, Row, SchemaConfig } from '@engine'
import elementsCsv from './data/elements.csv?raw'
import { elementsI18n } from './data/elements.i18n'
import { PeriodicBackground } from './components/PeriodicBackground'
import { PeriodicTablePage } from './components/PeriodicTablePage'
import { categoryClass } from './utils/elementCategory'

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

/** Tuile symbole/numéro en tête de fiche. */
const ficheDecor: FicheDecorator = (row) => ({
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
  return {
    rows,
    schema: applySchemaConfig(baseSchema, schemaConfig),
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
