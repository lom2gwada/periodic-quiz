const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const CORE = /^\[([A-Z][a-z]?)\]\s*/
const ORBITAL = /^(\d[spdf])(\d{1,2})$/

/** Configuration électronique écrite comme dans un manuel : cœur suivi d'une espace, exposants en haut — « [Ar]4s2 3d6 » → « [Ar] 4s² 3d⁶ ».
 *  `undefined` si la valeur n'a pas la forme d'une configuration ASCII (déjà mise en forme, autre colonne) : on la laisse telle quelle.
 *  Affichage seulement : la donnée reste en ASCII. */
export function formatConfiguration(raw: string): string | undefined {
  const text = raw.trim()
  const core = text.match(CORE)
  const tokens = text.replace(CORE, '').split(/\s+/).filter(Boolean)
  if (!tokens.length || !tokens.every((token) => ORBITAL.test(token))) return undefined
  const orbitals = tokens.map((token) => token.replace(ORBITAL, (_, orbital: string, count: string) => orbital + [...count].map((digit) => SUPERSCRIPT[Number(digit)]).join(''))).join(' ')
  return core ? `[${core[1]}] ${orbitals}` : orbitals
}

/** Façons de taper la même configuration au clavier : telle qu'en base, avec ou sans espace après le cœur (« [Ar]4s2 3d6 », « [Ar] 4s2 3d6 »).
 *  La réponse affichée (avec exposants) est déjà acceptée telle quelle ; la comparaison ignore la casse et les espaces multiples. */
export function configurationAliases(raw: string): string[] {
  if (formatConfiguration(raw) === undefined) return []
  const text = raw.trim()
  const withSpace = text.replace(CORE, (_, symbol: string) => `[${symbol}] `)
  const withoutSpace = text.replace(/^(\[[A-Z][a-z]?\])\s+/, '$1')
  return Array.from(new Set([text, withSpace, withoutSpace]))
}

interface ParsedConfiguration {
  /** Symbole du gaz noble de cœur, en minuscules (« ar »), ou '' s'il n'y en a pas. */
  core: string
  /** Sous-couche (« 4s ») → nombre d'électrons. */
  orbitals: Map<string, number>
}

/** Décompose une configuration électronique, quelle que soit sa notation : exposants Unicode ou chiffres, casse, espaces (avec ou sans
 *  espace après le cœur, plusieurs espaces). `null` si le texte n'a pas cette forme ou répète une sous-couche. */
function parseConfiguration(text: string): ParsedConfiguration | null {
  const ascii = text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => String(SUPERSCRIPT.indexOf(digit))).trim().toLowerCase()
  const core = ascii.match(/^\[([a-z]{1,2})\]/)
  const tokens = ascii.replace(/^\[[a-z]{1,2}\]/, '').split(/\s+/).filter(Boolean)
  const orbitals = new Map<string, number>()
  for (const token of tokens) {
    const match = token.match(ORBITAL)
    if (!match || orbitals.has(match[1])) return null
    orbitals.set(match[1], Number(match[2]))
  }
  if (!core && !orbitals.size) return null
  return { core: core?.[1] ?? '', orbitals }
}

/** Comparaison d'une configuration tapée avec les attendues, **par ensemble de sous-couches** : « [Rn] 5f3 6d1 7s2 » = « [Rn]7s2 5f3 6d1 » =
 *  « [Rn] 7s² 5f³ 6d¹ ». Une sous-couche fausse (nombre d'électrons, sous-couche absente ou en trop) ou un autre cœur est refusé. */
export function matchConfiguration(given: string, expected: string[]): boolean {
  const wanted = parseConfiguration(given)
  if (!wanted) return false
  return expected.some((candidate) => {
    const other = parseConfiguration(candidate)
    return other !== null && other.core === wanted.core && other.orbitals.size === wanted.orbitals.size && [...wanted.orbitals].every(([orbital, count]) => other.orbitals.get(orbital) === count)
  })
}
