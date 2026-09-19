import { useMemo, useState } from 'react'
import type { GenSchema, Row } from '../utils/quizGenerator'
import type { DataI18n } from '../i18n/data'
import { makeDatasetI18n } from '../i18n/dataset'
import { useLocale, useT } from '../i18n'
import { categoryClass } from '../utils/elementCategory'
import type { FicheTileColumns } from './Fiche'

interface PeriodicTablePageProps {
  rows: Row[]
  schema: GenSchema
  i18n?: DataI18n
  /** Colonnes symbole / numéro atomique / catégorie du jeu de données. */
  tile: FicheTileColumns
  groupColumn: string
  periodColumn: string
  onBack: () => void
  /** Ouvre la fiche de l'élément cliqué. Reçoit la valeur FR canonique. */
  onOpenFiche: (name: string) => void
}

const CATEGORY_ORDER = [
  'métal alcalin', 'métal alcalino-terreux', 'métal de transition', 'métal pauvre', 'métalloïde',
  'non-métal', 'halogène', 'gaz noble', 'lanthanide', 'actinide',
]

/** Le tableau périodique en grille 18 colonnes × 7 périodes (+ lanthanides/actinides en dessous),
 *  tuiles colorées par catégorie ; un clic ouvre la fiche. Légende cliquable : met une catégorie en
 *  évidence. Position lue dans les colonnes `groupe` / `periode` — les éléments sans groupe
 *  (lanthanides, actinides) vont sur les deux lignes du bas. */
export function PeriodicTablePage({ rows, schema, i18n, tile, groupColumn, periodColumn, onBack, onOpenFiche }: PeriodicTablePageProps) {
  const t = useT()
  const locale = useLocale()
  const data = useMemo(() => makeDatasetI18n(i18n, locale), [i18n, locale])
  const [highlight, setHighlight] = useState<string | null>(null)

  const cells = useMemo(() => {
    const items = rows.map((row) => {
      const z = Number(row[tile.number])
      const group = Number(row[groupColumn])
      const period = Number(row[periodColumn])
      const inMain = Number.isFinite(group) && group > 0 && Number.isFinite(period) && period > 0
      // f-block : 57-71 → ligne 9, 89-103 → ligne 10, colonnes 3 à 17.
      const fRow = z >= 57 && z <= 71 ? 9 : z >= 89 && z <= 103 ? 10 : 0
      const fCol = fRow === 9 ? z - 57 + 3 : z - 89 + 3
      return { row, canonical: row[schema.subjectColumn] ?? '', z, gridColumn: inMain ? group : fCol, gridRow: inMain ? period : fRow, ok: inMain || fRow > 0 }
    })
    return items.filter((c) => c.ok)
  }, [rows, schema.subjectColumn, tile.number, groupColumn, periodColumn])

  const categories = useMemo(() => {
    const present = new Set(rows.map((r) => r[tile.category]).filter(Boolean))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [rows, tile.category])

  return (
    <section className="periodic-page">
      <div className="stats-header">
        <h2>{t('periodic.title')}</h2>
        <button type="button" className="secondary" onClick={onBack}>{t('common.back')}</button>
      </div>
      <p>{t('periodic.hint')}</p>
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
            return (
              <button
                key={canonical}
                type="button"
                role="gridcell"
                className={`element-tile ${categoryClass(category)}${dimmed ? ' is-dimmed' : ''}`}
                style={{ gridColumn, gridRow }}
                onClick={() => onOpenFiche(canonical)}
                aria-label={data.value(canonical)}
              >
                <span className="element-number">{row[tile.number]}</span>
                <span className="element-symbol">{row[tile.symbol]}</span>
                <span className="element-name">{data.value(canonical)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
