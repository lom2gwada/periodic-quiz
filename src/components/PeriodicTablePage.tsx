import { useMemo, useState } from 'react'
import { makeDatasetI18n, useLocale, useT } from '@engine'
import type { DataI18n, GenSchema, Row } from '@engine'
import { categoryClass } from '../utils/elementCategory'
import { elementPosition } from '../utils/elementPosition'

/** Colonnes du jeu de données qui alimentent une tuile d'élément (symbole, numéro, catégorie). */
export interface TileColumns {
  symbol: string
  number: string
  category: string
}

interface PeriodicTablePageProps {
  rows: Row[]
  schema: GenSchema
  i18n?: DataI18n
  /** Colonnes symbole / numéro atomique / catégorie du jeu de données. */
  tile: TileColumns
  groupColumn: string
  periodColumn: string
  onBack?: () => void
  /** Ouvre la fiche de l'élément cliqué. Reçoit la valeur FR canonique. */
  onOpenFiche?: (name: string) => void
  /** Mode « Cliquez sur X » (question de quiz) : tuiles vides (ni numéro, ni symbole, ni nom — ils donneraient la réponse),
   *  seule la couleur de catégorie reste ; un clic désigne un élément au lieu d'ouvrir sa fiche. */
  pick?: { selected?: string; onPick: (name: string) => void }
}

const CATEGORY_ORDER = [
  'métal alcalin', 'métal alcalino-terreux', 'métal de transition', 'métal pauvre', 'métalloïde',
  'non-métal', 'halogène', 'gaz noble', 'lanthanide', 'actinide',
]

/** Le tableau périodique en grille 18 colonnes × 7 périodes (+ lanthanides/actinides en dessous),
 *  tuiles colorées par catégorie ; un clic ouvre la fiche. Légende cliquable : met une catégorie en
 *  évidence. Position lue dans les colonnes `groupe` / `periode` — les éléments sans groupe
 *  (lanthanides, actinides) vont sur les deux lignes du bas. */
export function PeriodicTablePage({ rows, schema, i18n, tile, groupColumn, periodColumn, onBack, onOpenFiche, pick }: PeriodicTablePageProps) {
  const t = useT()
  const locale = useLocale()
  const data = useMemo(() => makeDatasetI18n(i18n, locale), [i18n, locale])
  const [highlight, setHighlight] = useState<string | null>(null)

  const cells = useMemo(() => {
    const items = rows.map((row) => {
      const z = Number(row[tile.number])
      const group = Number(row[groupColumn])
      const period = Number(row[periodColumn])
      const position = elementPosition(z, group, period)
      return { row, canonical: row[schema.subjectColumn] ?? '', z, gridColumn: position?.column ?? 0, gridRow: position?.row ?? 0, ok: position !== null }
    })
    return items.filter((c) => c.ok)
  }, [rows, schema.subjectColumn, tile.number, groupColumn, periodColumn])

  const categories = useMemo(() => {
    const present = new Set(rows.map((r) => r[tile.category]).filter(Boolean))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [rows, tile.category])

  const body = (
    <>
      <div className="periodic-legend" role="group" aria-label={t('periodic.legend')}>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`periodic-legend-item ${categoryClass(c)}${highlight === c ? ' is-active' : ''}`}
            aria-pressed={highlight === c}
            onClick={() => setHighlight((current) => (current === c ? null : c))}
          >
            {data.value(c)}
          </button>
        ))}
      </div>
      <div className="periodic-scroll">
        <div className="periodic-grid" role="grid" aria-label={t('periodic.title')}>
          <span className="periodic-placeholder" style={{ gridColumn: 3, gridRow: 6 }} aria-hidden="true">57–71</span>
          <span className="periodic-placeholder" style={{ gridColumn: 3, gridRow: 7 }} aria-hidden="true">89–103</span>
          {cells.map(({ row, canonical, gridColumn, gridRow }) => {
            const category = row[tile.category] ?? ''
            const dimmed = highlight !== null && category !== highlight
            const picked = pick?.selected === canonical
            return (
              <button
                key={canonical}
                type="button"
                role="gridcell"
                className={`element-tile ${categoryClass(category)}${dimmed ? ' is-dimmed' : ''}${picked ? ' is-picked' : ''}`}
                style={{ gridColumn, gridRow }}
                onClick={() => (pick ? pick.onPick(canonical) : onOpenFiche?.(canonical))}
                aria-label={pick ? `${gridRow}-${gridColumn}` : data.value(canonical)}
              >
                {!pick && <>
                  <span className="element-number">{row[tile.number]}</span>
                  <span className="element-symbol">{row[tile.symbol]}</span>
                  <span className="element-name">{data.value(canonical)}</span>
                </>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  if (pick) return <div className="periodic-pick">{body}</div>
  return (
    <section className="periodic-page">
      <div className="stats-header">
        <h2>{t('periodic.title')}</h2>
        <button type="button" className="secondary" onClick={onBack}>{t('common.back')}</button>
      </div>
      <p>{t('periodic.hint')}</p>
      {body}
    </section>
  )
}
