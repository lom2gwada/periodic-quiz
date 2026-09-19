import { describe, expect, it } from 'vitest'
import { elementPosition } from './elementPosition'

describe('elementPosition', () => {
  it('uses group and period for main-block elements', () => {
    expect(elementPosition(1, 1, 1)).toEqual({ column: 1, row: 1 })
    expect(elementPosition(2, 18, 1)).toEqual({ column: 18, row: 1 })
    expect(elementPosition(26, 8, 4)).toEqual({ column: 8, row: 4 })
  })

  it('puts lanthanides and actinides on the two bottom rows, columns 3 to 17', () => {
    expect(elementPosition(57, NaN, 6)).toEqual({ column: 3, row: 9 })
    expect(elementPosition(71, NaN, 6)).toEqual({ column: 17, row: 9 })
    expect(elementPosition(89, NaN, 7)).toEqual({ column: 3, row: 10 })
    expect(elementPosition(103, NaN, 7)).toEqual({ column: 17, row: 10 })
  })

  it('returns null when the position is unknown', () => {
    expect(elementPosition(999, NaN, NaN)).toBeNull()
  })
})
