import { describe, expect, it } from 'vitest'
import { matchesExpected } from '@engine/utils/answerMatch'
import { configurationAliases, formatConfiguration } from './electronConfig'

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
