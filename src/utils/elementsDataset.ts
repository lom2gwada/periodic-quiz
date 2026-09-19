import { supabase } from './supabase'
import type { GenSchema, Row } from './quizGenerator'

// Mêmes clés/ordre que les en-têtes de src/data/elements.csv — la table Supabase en est un miroir
// éditable (colonne par colonne, tout en texte), pour corriger une donnée sans redéployer l'appli.
const COLUMNS = [
  'element', 'article', 'symbole', 'numero_atomique', 'masse_atomique_u', 'categorie', 'groupe', 'periode',
  'etat', 'electronegativite', 'point_fusion_c', 'point_ebullition_c', 'masse_volumique_g_cm3',
  'annee_decouverte', 'configuration_electronique', 'etats_oxydation',
]

/** Version éditable (dashboard Supabase, ou depuis l'appli pour les admins — cf. updateElementRow)
 *  du dataset embarqué `elements.csv` — mêmes lignes/colonnes, en base plutôt que dans le code.
 *  `null` si indisponible (hors-ligne, RLS…) : l'appli reste alors sur le CSV embarqué, jamais
 *  bloquée par ce fetch. */
export async function fetchElementsDataset(): Promise<Row[] | null> {
  const { data, error } = await supabase
    .from('periodic_elements')
    .select(COLUMNS.join(','))
    .order('row_order', { ascending: true })
  if (error || !data?.length) return null
  return data as unknown as Row[]
}

/** Met à jour les champs d'un élément existant (`element` = clé, non modifiable ici — renommer un élément sortirait
 *  du périmètre : elements.i18n.ts reste indexé par ce nom exact).
 *  Réservé aux admins côté RLS (policy UPDATE sur periodic_elements). Un refus RLS ne
 *  remonte pas d'erreur PostgREST (juste 0 ligne affectée) : on le détecte nous-mêmes via `.select()`
 *  pour ne jamais rapporter un succès silencieusement faux à l'appelant. */
export async function updateElementRow(element: string, patch: Partial<Row>): Promise<void> {
  const { data, error } = await supabase.from('periodic_elements').update(patch).eq('element', element).select('element')
  if (error) throw error
  if (!data?.length) throw new Error('Mise à jour refusée (droits insuffisants ou élément introuvable).')
}

/** Réglages du panneau de génération (GeneratorPanel) qui ont du sens à partager : nom/titre et,
 *  par colonne, seulement ce qu'on peut y ajuster (`include`/`multivalueSeparator`) — pas
 *  kind/isYear/unique/label/unit, qui restent dérivés des données par `inferSchema` à chaque fetch.
 *  Volontairement sans `subjectColumn` : c'est `element`, clé de elements.i18n.ts et des fiches. */
export interface ElementsSchemaConfig {
  noun: string
  title: string
  columns: Record<string, { include?: boolean; multivalueSeparator?: string }>
}

const SCHEMA_ROW_ID = 1

/** `null` si indisponible (hors-ligne, table pas encore seedée…) : l'appli retombe alors sur le
 *  schéma auto-inféré, comme avant l'existence de cette table. */
export async function fetchElementsSchemaConfig(): Promise<ElementsSchemaConfig | null> {
  const { data, error } = await supabase
    .from('periodic_schema')
    .select('noun,title,columns')
    .eq('id', SCHEMA_ROW_ID)
    .maybeSingle()
  if (error || !data) return null
  return { noun: data.noun, title: data.title, columns: data.columns ?? {} }
}

/** Réservé aux admins côté RLS (policy UPDATE sur periodic_schema) — même détection du
 *  refus silencieux RLS que updateElementRow. */
export async function updateElementsSchemaConfig(config: ElementsSchemaConfig): Promise<void> {
  const { data, error } = await supabase
    .from('periodic_schema')
    .update({ noun: config.noun, title: config.title, columns: config.columns, updated_at: new Date().toISOString() })
    .eq('id', SCHEMA_ROW_ID)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Mise à jour refusée (droits insuffisants).')
}

/** Complète un schéma auto-inféré avec les réglages partagés (nom/titre, include/séparateur par
 *  colonne) — les colonnes absentes de `config.columns` gardent leurs valeurs inférées. */
export function applyElementsSchemaConfig(inferred: GenSchema, config: ElementsSchemaConfig | null): GenSchema {
  if (!config) return inferred
  const columns: GenSchema['columns'] = { ...inferred.columns }
  for (const [col, override] of Object.entries(config.columns)) {
    if (!columns[col]) continue
    columns[col] = { ...columns[col], ...override }
  }
  return { ...inferred, noun: config.noun || inferred.noun, title: config.title || inferred.title, columns }
}

/** Extrait d'un GenSchema la config partageable (l'inverse d'applyElementsSchemaConfig), pour
 *  sauvegarder l'état courant du panneau. */
export function toElementsSchemaConfig(schema: GenSchema): ElementsSchemaConfig {
  const columns: ElementsSchemaConfig['columns'] = {}
  for (const [col, spec] of Object.entries(schema.columns)) columns[col] = { include: spec.include, multivalueSeparator: spec.multivalueSeparator }
  return { noun: schema.noun, title: schema.title, columns }
}
