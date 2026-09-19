import { describe, expect, it } from 'vitest'
import elementsCsv from '../data/elements.csv?raw'
import { elementsI18n } from '../data/elements.i18n'
import { parseQuiz } from '@engine/utils/quizValidation'
import { generateQuiz, inferSchema, parseCsv } from '@engine'

const rows = parseCsv(elementsCsv)

describe('parseCsv', () => {
  it('detects the delimiter from the header line', () => {
    expect(parseCsv('a;b;c\n1;2;3')).toEqual([{ a: '1', b: '2', c: '3' }])
    expect(parseCsv('a,b\nx,y')).toEqual([{ a: 'x', b: 'y' }])
  })

  it('honours quoted fields containing the delimiter', () => {
    expect(parseCsv('nom,ville\n"Doe, John","Paris, FR"')).toEqual([{ nom: 'Doe, John', ville: 'Paris, FR' }])
  })

  it('keeps multivalue cells intact', () => {
    expect(parseCsv('element;etats\nFer;+2|+3')[0].etats).toBe('+2|+3')
  })

  it('parses the bundled dataset: 118 elements, atomic numbers 1..118', () => {
    expect(rows).toHaveLength(118)
    expect(rows.map((r) => Number(r.numero_atomique))).toEqual(Array.from({ length: 118 }, (_, i) => i + 1))
    expect(rows[0]).toMatchObject({ element: 'Hydrogène', symbole: 'H' })
  })
})

describe('bundled dataset consistency', () => {
  it('has a unique name and symbol per element', () => {
    expect(new Set(rows.map((r) => r.element)).size).toBe(118)
    expect(new Set(rows.map((r) => r.symbole)).size).toBe(118)
  })

  it('has English names', () => {
    expect(elementsI18n.values.Fer.en).toBe('Iron')
    expect(elementsI18n.values.Or.en).toBe('Gold')
    expect(elementsI18n.values['Césium'].en).toBe('Caesium')
  })

  it('places main-block elements on a group/period and f-block elements on none', () => {
    const fe = rows.find((r) => r.symbole === 'Fe')!
    expect([fe.groupe, fe.periode]).toEqual(['8', '4'])
    expect(rows.find((r) => r.symbole === 'La')!.groupe).toBe('')
    expect(rows.find((r) => r.symbole === 'U')!.groupe).toBe('')
    expect(rows.find((r) => r.symbole === 'Og')!.groupe).toBe('18')
  })

  it('every category value has an English translation', () => {
    for (const category of new Set(rows.map((r) => r.categorie))) expect(elementsI18n.values[category]?.en, category).toBeTruthy()
  })
})

describe('inferSchema on the elements dataset', () => {
  const schema = inferSchema(rows)

  it('picks the element name as subject and the article column', () => {
    expect(schema.subjectColumn).toBe('element')
    expect(schema.articleColumn).toBe('article')
  })

  it('detects numbers, units and years', () => {
    expect(schema.columns.symbole.kind).toBe('string')
    expect(schema.columns.symbole.unique).toBe(true)
    expect(schema.columns.masse_atomique_u).toMatchObject({ kind: 'number', unit: 'u' })
    expect(schema.columns.point_fusion_c).toMatchObject({ kind: 'number', unit: '°C' })
    expect(schema.columns.masse_volumique_g_cm3.unit).toBe('g/cm³')
    expect(schema.columns.annee_decouverte.isYear).toBe(true)
    expect(schema.columns.etats_oxydation.multivalueSeparator).toBe('|')
  })

  it('treats group and period as categories, not quantities', () => {
    expect(schema.columns.groupe.kind).toBe('string')
    expect(schema.columns.periode.kind).toBe('string')
    expect(schema.columns.numero_atomique.kind).toBe('number')
  })
})

describe('generateQuiz on the elements dataset', () => {
  const schema = { ...inferSchema(rows), noun: 'élément', title: 'Le tableau périodique des éléments' }
  const quiz = generateQuiz(rows, schema, { seed: 'test', i18n: elementsI18n })

  it('passes the strict quiz validation', () => {
    expect(() => parseQuiz(quiz)).not.toThrow()
    expect(quiz.questions.length).toBeGreaterThan(500)
  })

  it('is deterministic for a given seed and varies with the seed', () => {
    expect(generateQuiz(rows, schema, { seed: 'test', i18n: elementsI18n })).toEqual(quiz)
    expect(generateQuiz(rows, schema, { seed: 'other', i18n: elementsI18n })).not.toEqual(quiz)
  })

  it('asks about symbols with the correct answer', () => {
    const cloze = quiz.questions.find((q) => q.type === 'cloze' && q.subject === 'Fer' && q.tags.includes('symbole'))
    expect(cloze?.question).toBe('Symbole du fer : ___')
    if (cloze?.type === 'cloze') expect(cloze.content.expectedAnswers).toContain('Fe')
  })

  it('translates questions to English with the element names', () => {
    const en = generateQuiz(rows, schema, { seed: 'test', locale: 'en', i18n: elementsI18n })
    expect(() => parseQuiz(en)).not.toThrow()
    const cloze = en.questions.find((q) => q.type === 'cloze' && q.subject === 'Fer' && q.tags.includes('symbole'))
    expect(cloze?.question).toMatch(/iron/i)
    expect(cloze?.question).not.toMatch(/Fer/)
  })

  it('never generates a question from an empty cell', () => {
    const heliumDensity = quiz.questions.filter((q) => q.subject === 'Hélium' && q.tags.includes('masse_volumique_g_cm3'))
    expect(heliumDensity).toEqual([]) // gaz : masse volumique volontairement vide
  })
})
