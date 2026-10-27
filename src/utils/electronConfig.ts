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
