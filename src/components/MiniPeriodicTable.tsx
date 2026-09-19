import { categoryClass } from '../utils/elementCategory'
import type { GridPosition } from '../utils/elementPosition'

// Cases occupées du tableau (colonne → lignes) : période 1 = H et He ; périodes 2-3 = blocs s et p ;
// 4-5 = 18 colonnes ; 6-7 = 18 colonnes dont la colonne 3, qui renvoie au bloc f (lignes 9-10).
const CELLS: GridPosition[] = (() => {
  const cells: GridPosition[] = []
  const columnsOf = (period: number): number[] => {
    if (period === 1) return [1, 18]
    if (period <= 3) return [1, 2, 13, 14, 15, 16, 17, 18]
    return Array.from({ length: 18 }, (_, i) => i + 1)
  }
  for (let period = 1; period <= 7; period++) for (const column of columnsOf(period)) cells.push({ column, row: period })
  for (const row of [9, 10]) for (let column = 3; column <= 17; column++) cells.push({ column, row })
  return cells
})()

const STEP = 5
const GAP = 0.6

/** Aperçu du tableau périodique où seul l'élément courant est coloré (couleur de sa catégorie) : donne
 *  d'un coup d'œil sa place (bloc, famille, période), avec son symbole quand la taille le permet (voir `.mini-table-symbol` dans app.css). Purement décoratif, la fiche donne déjà groupe et période. */
export function MiniPeriodicTable({ position, category, symbol, className }: { position: GridPosition | null; category: string; symbol?: string; className?: string }) {
  return (
    <svg className={`mini-table ${categoryClass(category)}${className ? ` ${className}` : ''}`} viewBox={`0 0 ${18 * STEP} ${10 * STEP}`} aria-hidden="true">
      {CELLS.map(({ column, row }) => (
        <rect
          key={`${column}-${row}`}
          className="mini-table-cell"
          x={(column - 1) * STEP + GAP / 2}
          y={(row - 1) * STEP + GAP / 2}
          width={STEP - GAP}
          height={STEP - GAP}
          rx={0.7}
        />
      ))}
      {position && (
        <>
          {/* Légèrement plus grande que la case : déborde sur ses voisines pour mieux ressortir et loger le symbole. */}
          <rect
            className="mini-table-current"
            x={(position.column - 1) * STEP - 0.6}
            y={(position.row - 1) * STEP - 0.6}
            width={STEP + 1.2}
            height={STEP + 1.2}
            rx={1.2}
          />
          {symbol && (
            <text className="mini-table-symbol" x={(position.column - 0.5) * STEP} y={(position.row - 0.5) * STEP}>{symbol}</text>
          )}
        </>
      )}
    </svg>
  )
}
