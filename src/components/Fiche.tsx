import { useMemo } from 'react'
import type { GenSchema, Row } from '../utils/quizGenerator'
import type { DataI18n } from '../i18n/data'
import { makeDatasetI18n, splitAnnotation } from '../i18n/dataset'
import { getGrammar } from '../i18n/grammar'
import { useLocale } from '../i18n'
import { formatNumericValue } from '../utils/number'
import { categoryClass } from '../utils/elementCategory'

/** Colonnes du jeu de données qui alimentent la « tuile » d'élément en tête de fiche. */
export interface FicheTileColumns {
  symbol: string
  number: string
  category: string
}

interface FicheProps {
  row: Row
  schema: GenSchema
  i18n?: DataI18n
  tile?: FicheTileColumns
}

/** Contenu d'une fiche : en-tête (tuile symbole/numéro + nom) et liste des champs non vides,
 * rendu générique depuis le schéma, traduit via le sidecar. Utilisé dans la grille Fiches et la modale. */
export function Fiche({ row, schema, i18n, tile }: FicheProps) {
  const locale = useLocale()
  const data = useMemo(() => makeDatasetI18n(i18n, locale), [i18n, locale])
  const cap = getGrammar(locale).cap

  const { subjectColumn, articleColumn, columns } = schema
  const canonical = row[subjectColumn] ?? '' // valeur FR canonique
  const name = data.value(canonical)
  const article = data.article(canonical, articleColumn ? row[articleColumn] : undefined)
  const imageCol = Object.keys(columns).find((c) => columns[c].include && columns[c].isImage)
  const image = imageCol && /^https?:\/\//.test((row[imageCol] ?? '').trim()) ? row[imageCol].trim() : null
  const factCols = Object.entries(columns).filter(
    ([c, s]) => s.include && !s.isImage && c !== subjectColumn && c !== articleColumn,
  )

  return (
    <div className="fiche">
      <header className="fiche-head">
        {tile && (
          <span className={`element-tile fiche-tile ${categoryClass(row[tile.category] ?? '')}`} aria-hidden="true">
            <span className="element-number">{row[tile.number]}</span>
            <span className="element-symbol">{row[tile.symbol]}</span>
          </span>
        )}
        <h3>{article && <span className="fiche-article">{article} </span>}{name}</h3>
        {image && <img className="fiche-flag" src={image} alt="" loading="lazy" />}
      </header>
      <dl className="fiche-facts">
        {factCols.map(([col, spec]) => {
          const raw = (row[col] ?? '').trim()
          if (!raw) return null
          const parts = spec.multivalueSeparator
            ? raw.split(spec.multivalueSeparator).map((s) => {
                const { name, annotation } = splitAnnotation(s.trim())
                const translated = data.value(name)
                return translated && annotation ? `${translated} ${annotation}` : translated
              }).filter(Boolean)
            : null
          let value = spec.kind === 'number' ? raw : data.value(raw)
          if (!parts && spec.kind === 'number') {
            const n = Number(raw.replace(/\s/g, '').replace(',', '.'))
            const displayUnit = spec.unit ? data.unit(spec.unit) : undefined
            if (Number.isFinite(n)) value = `${formatNumericValue(n, spec.isYear, undefined, displayUnit)}${displayUnit && !spec.isYear ? ` ${displayUnit}` : ''}`
          }
          return (
            <div className="fiche-fact" key={col}>
              <dt>{cap(data.label(spec.label))}</dt>
              <dd>{parts ? parts.map((p) => <span className="pill" key={p}>{p}</span>) : value}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
