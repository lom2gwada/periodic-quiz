import { describe, expect, it } from 'vitest'
import { elementsI18n } from '../data/elements.i18n'
import { makeDatasetI18n, splitAnnotation } from './dataset'

describe('makeDatasetI18n', () => {
  it('falls back to the raw value when no sidecar / no locale entry', () => {
    const d = makeDatasetI18n(undefined, 'en')
    expect(d.value('Hydrogène')).toBe('Hydrogène')
    expect(d.label('groupe')).toBe('groupe')
  })

  it('translates element names, categories and labels for English', () => {
    const en = makeDatasetI18n(elementsI18n, 'en')
    expect(en.value('Hydrogène')).toBe('Hydrogen')
    expect(en.value('Or')).toBe('Gold')
    expect(en.value('métal alcalino-terreux')).toBe('alkaline earth metal')
    expect(en.label('masse volumique')).toBe('density')
  })

  it('keeps names that are identical in both languages, and falls back to French for es/nl/ht', () => {
    expect(makeDatasetI18n(elementsI18n, 'en').value('Lithium')).toBe('Lithium')
    expect(makeDatasetI18n(elementsI18n, 'es').value('Hydrogène')).toBe('Hydrogène')
  })

  it('applies the French label corrections (accents)', () => {
    const fr = makeDatasetI18n(elementsI18n, 'fr')
    expect(fr.label('electronegativite')).toBe('électronégativité')
    expect(fr.label('point fusion')).toBe('point de fusion')
  })

  it('resolves the article: French from the CSV column only, none in English', () => {
    const fr = makeDatasetI18n(elementsI18n, 'fr')
    const en = makeDatasetI18n(elementsI18n, 'en')
    expect(fr.ofSubject('Hydrogène', "l'")).toBe("de l'hydrogène")
    expect(fr.ofSubject('Fer', 'le')).toBe('du fer')
    expect(en.ofSubject('Iron', 'le')).toBe('of iron')
  })
})

describe('splitAnnotation', () => {
  it('extracts a trailing parenthetical annotation', () => {
    expect(splitAnnotation('christianisme (85 %)')).toEqual({ name: 'christianisme', annotation: '(85 %)' })
  })

  it('leaves a value with no annotation untouched', () => {
    expect(splitAnnotation('christianisme')).toEqual({ name: 'christianisme', annotation: '' })
  })

  it('strips any trailing parenthetical, not just a percentage', () => {
    expect(splitAnnotation('Saint-Georges (île)')).toEqual({ name: 'Saint-Georges', annotation: '(île)' })
  })

  it('only strips a parenthetical at the very end, not one that starts the string', () => {
    expect(splitAnnotation('(entre parenthèses) pas à la fin')).toEqual({ name: '(entre parenthèses) pas à la fin', annotation: '' })
  })
})
