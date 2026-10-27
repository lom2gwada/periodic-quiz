import { describe, expect, it } from 'vitest'
import { matchesExpected } from '@engine/utils/answerMatch'
import { configurationAliases, formatConfiguration, matchConfiguration } from './electronConfig'

describe('formatConfiguration', () => {
  it('met les exposants et une espace après le cœur', () => {
    expect(formatConfiguration('[Ar]4s2 3d6')).toBe('[Ar] 4s² 3d⁶')
    expect(formatConfiguration('[Ar]4s1 3d10')).toBe('[Ar] 4s¹ 3d¹⁰')
    expect(formatConfiguration('[Xe]6s2 4f14 5d10 6p2')).toBe('[Xe] 6s² 4f¹⁴ 5d¹⁰ 6p²')
  })

  it('sans cœur (hydrogène, hélium)', () => {
    expect(formatConfiguration('1s1')).toBe('1s¹')
    expect(formatConfiguration('1s2')).toBe('1s²')
  })

  it('accepte déjà une espace après le cœur et laisse le reste intact', () => {
    expect(formatConfiguration('[He] 2s2 2p4')).toBe('[He] 2s² 2p⁴')
    expect(formatConfiguration('métal alcalin')).toBeUndefined()
    expect(formatConfiguration('[Ar] 4s² 3d⁶')).toBeUndefined()
    expect(formatConfiguration('')).toBeUndefined()
  })
})

describe('configurationAliases', () => {
  it('propose la saisie ASCII avec et sans espace après le cœur', () => {
    expect(configurationAliases('[Ar]4s2 3d6')).toEqual(['[Ar]4s2 3d6', '[Ar] 4s2 3d6'])
    expect(configurationAliases('1s2')).toEqual(['1s2'])
    expect(configurationAliases('solide')).toEqual([])
  })

  it('les deux notations sont acceptées à la saisie', () => {
    const expected = [formatConfiguration('[Ar]4s2 3d6')!, ...configurationAliases('[Ar]4s2 3d6')]
    for (const typed of ['[Ar] 4s² 3d⁶', '[Ar]4s2 3d6', '[Ar] 4s2 3d6', '[AR]4S2  3D6']) expect(matchesExpected(typed, expected, false)).toBe(true)
    expect(matchesExpected('[Ar]4s2 3d7', expected, false)).toBe(false)
  })
})

describe('matchConfiguration', () => {
  const expected = ['[Rn]7s2 5f3 6d1', '[Rn] 7s² 5f³ 6d¹']

  it('accepte une autre notation : ordre des sous-couches, espaces, exposants Unicode, casse', () => {
    for (const typed of ['[Rn] 5f3 6d1 7s2', '[Rn]7s2 5f3 6d1', '[Rn]  6d1   5f3 7s2', '[Rn] 5f³ 6d¹ 7s²', '[RN]5F3 6D1 7S2']) expect(matchConfiguration(typed, expected), typed).toBe(true)
  })

  it('refuse une sous-couche fausse, manquante ou en trop, ou un autre cœur', () => {
    for (const typed of ['[Rn] 5f4 6d1 7s2', '[Rn] 5f3 6d1', '[Rn] 5f3 6d1 7s2 7p1', '[Rn] 5f3 6d2 7s2', '[Xe] 5f3 6d1 7s2', '5f3 6d1 7s2']) expect(matchConfiguration(typed, expected), typed).toBe(false)
  })

  it('refuse un texte qui n’est pas une configuration, ou qui répète une sous-couche', () => {
    expect(matchConfiguration('uranium', expected)).toBe(false)
    expect(matchConfiguration('', expected)).toBe(false)
    expect(matchConfiguration('[Rn] 7s2 7s2 5f3 6d1', expected)).toBe(false)
  })

  it('sans cœur', () => {
    expect(matchConfiguration('1s²', ['1s2'])).toBe(true)
    expect(matchConfiguration('1s1', ['1s2'])).toBe(false)
  })
})
