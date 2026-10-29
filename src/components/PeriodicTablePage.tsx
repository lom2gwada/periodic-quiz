import { useEffect, useMemo, useRef, useState } from 'react'
import { makeDatasetI18n, useLocale, useT } from '@engine'
import { storageKey } from '@engine/config'
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
  pick?: { selected?: string; onPick: (name: string) => void; /** Correction : la bonne case et la réponse donnée sont révélées, le tableau n'est plus cliquable. */ review?: { target: string } }
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
  // Quand le tableau dépasse la largeur disponible (téléphone), il défile : ombres aux bords concernés et consigne « faites glisser ».
  const scrollRef = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState({ left: false, right: false })
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setMore({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(el)
    return () => { el.removeEventListener('scroll', update); observer?.disconnect() }
  }, [rows.length])
  // Une rangée et une colonne d'en-têtes (groupes 1-18, périodes 1-7) décalent la grille d'un cran.
  const offset = 1
  // Question « Cliquez sur X » : option « sans indice de couleur » (mémorisée) — la couleur de catégorie et la légende donnent sinon
  // la réponse à qui connaît les familles d'éléments (le sodium est dans la colonne rouge des métaux alcalins).
  const [noColors, setNoColors] = useState(() => { try { return localStorage.getItem(storageKey('pick-no-colors')) === '1' } catch { return false } })
  const toggleColors = (checked: boolean) => { setNoColors(checked); try { localStorage.setItem(storageKey('pick-no-colors'), checked ? '1' : '0') } catch { /* non bloquant */ } }
  // Nom accessible d'une case sans nommer l'élément : « Période 3, groupe 1 » ; bloc f : « Période 6, bloc f, position 3 ».
  const cellName = (column: number, row: number) => row >= 9
    ? t('periodic.cellLabelF', { period: row - 3, n: column - 2 })
    : t('periodic.cellLabel', { period: row, group: column })

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

  const review = pick?.review
  const targetRef = useRef<HTMLButtonElement>(null)
  // Sur téléphone le tableau défile : on amène la bonne case dans la zone visible (défilement horizontal du seul tableau, pas de la page).
  useEffect(() => {
    const wrap = scrollRef.current
    const tileEl = targetRef.current
    if (!review || !wrap || !tileEl) return
    wrap.scrollLeft = Math.max(0, tileEl.offsetLeft - (wrap.clientWidth - tileEl.offsetWidth) / 2)
  }, [review, cells])

  const pickedCell = pick?.selected ? cells.find((cell) => cell.canonical === pick.selected) : undefined

  const categories = useMemo(() => {
    const present = new Set(rows.map((r) => r[tile.category]).filter(Boolean))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [rows, tile.category])

  const body = (
    <>
      {pick && !review && <label className="periodic-toggle"><input type="checkbox" checked={noColors} onChange={(event) => toggleColors(event.target.checked)} /> {t('periodic.noColors')}</label>}
      {!review && !(pick && noColors) && <div className="periodic-legend" role="group" aria-label={t('periodic.legend')}>
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
      </div>}
      {pick && !review && <p className="periodic-selection" role="status">{pickedCell ? t('periodic.selected', { cell: cellName(pickedCell.gridColumn, pickedCell.gridRow) }) : t('periodic.noSelection')}</p>}
      {(more.left || more.right) && <p className="periodic-scroll-hint">{t('periodic.scrollHint')}</p>}
      <div className={`periodic-scroll-wrap${more.left ? ' more-left' : ''}${more.right ? ' more-right' : ''}`}>
      <div className="periodic-scroll" ref={scrollRef}>
        <div className="periodic-grid has-axes" role="grid" aria-label={t('periodic.title')}>
          {Array.from({ length: 18 }, (_, index) => <span key={`g${index}`} className="periodic-axis" style={{ gridColumn: index + 2, gridRow: 1 }} aria-hidden="true">{index + 1}</span>)}
          {Array.from({ length: 7 }, (_, index) => <span key={`p${index}`} className="periodic-axis" style={{ gridColumn: 1, gridRow: index + 2 }} aria-hidden="true">{index + 1}</span>)}
          <span className="periodic-placeholder" style={{ gridColumn: 3 + offset, gridRow: 6 + offset }} aria-hidden="true">57–71</span>
          <span className="periodic-placeholder" style={{ gridColumn: 3 + offset, gridRow: 7 + offset }} aria-hidden="true">89–103</span>
          {cells.map(({ row, canonical, gridColumn, gridRow }) => {
            const category = row[tile.category] ?? ''
            const dimmed = highlight !== null && category !== highlight
            const picked = pick?.selected === canonical
            const isTarget = review?.target === canonical
            const isWrong = !!review && picked && !isTarget
            return (
              <button
                key={canonical}
                type="button"
                role="gridcell"
                className={`element-tile ${categoryClass(category)}${dimmed ? ' is-dimmed' : ''}${picked && !review ? ' is-picked' : ''}${isTarget ? ' is-target' : ''}${isWrong ? ' is-wrong' : ''}`}
                style={{ gridColumn: gridColumn + offset, gridRow: gridRow + offset }}
                ref={isTarget ? targetRef : undefined}
                disabled={!!review}
                onClick={() => (pick ? pick.onPick(canonical) : onOpenFiche?.(canonical))}
                aria-label={review ? (isTarget ? `${data.value(canonical)} — ${t('periodic.reviewTarget')}` : isWrong ? `${data.value(canonical)} — ${t('periodic.reviewWrong')}` : cellName(gridColumn, gridRow)) : pick ? cellName(gridColumn, gridRow) : data.value(canonical)}
                aria-selected={pick ? picked : undefined}
                title={pick ? undefined : data.value(canonical)}
              >
                {(!pick || isTarget || isWrong) && <>
                  <span className="element-number">{row[tile.number]}</span>
                  <span className="element-symbol">{row[tile.symbol]}</span>
                  {!pick && <span className="element-name">{data.value(canonical)}</span>}
                </>}
              </button>
            )
          })}
        </div>
      </div>
      </div>
    </>
  )

  if (pick) return <div className={noColors && !review ? 'periodic-pick no-colors' : review ? 'periodic-pick is-review' : 'periodic-pick'}>{body}{review && <p className="periodic-review-legend"><span className="swatch is-target" aria-hidden="true" /> {t('periodic.reviewTarget')}{pick.selected && pick.selected !== review.target && <> · <span className="swatch is-wrong" aria-hidden="true" /> {t('periodic.reviewWrong')}</>}</p>}</div>
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
