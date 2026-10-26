import { describe, expect, it } from 'vitest'
import elementsCsv from '../data/elements.csv?raw'
import { elementsI18n } from '../data/elements.i18n'
import { appSpec } from '../appSpec'
import { generateQuiz, inferSchema, parseCsv, makeDatasetI18n } from '@engine'

const rows = parseCsv(elementsCsv)
const LOCALES = ['fr', 'en', 'es', 'nl', 'ht'] as const
const TRANSLATED = ['en', 'es', 'nl', 'ht'] as const
const dataset = appSpec.buildDataset(rows, null)

describe('Periodic Quiz — toutes les langues sont couvertes', () => {
  it.each(TRANSLATED)('%s : chaque catégorie et chaque état du jeu de données est traduit', (locale) => {
    for (const column of ['categorie', 'etat']) {
      for (const value of new Set(rows.map((row) => row[column]).filter(Boolean))) {
        expect(elementsI18n.values[value]?.[locale], `${locale} / ${value}`).toBeTruthy()
      }
    }
  })

  it.each(TRANSLATED)('%s : chaque libellé de colonne est traduit', (locale) => {
    for (const [label, translations] of Object.entries(elementsI18n.columnLabels)) {
      expect(translations[locale], `${locale} / ${label}`).toBeTruthy()
    }
  })

  it.each(['es', 'nl', 'ht'] as const)('%s : les noms d’éléments sont traduits (seuls quelques noms sont identiques au français)', (locale) => {
    const t = makeDatasetI18n(elementsI18n, locale)
    const identical = rows.filter((row) => t.value(row.element) === row.element).map((row) => row.element)
    // nl garde des noms identiques (Calcium, Argon…) ; es et ht n'en ont presque aucun.
    expect(identical.length, identical.join(', ')).toBeLessThan(locale === 'nl' ? 70 : 5)
    expect(new Set(rows.map((row) => t.value(row.element))).size, `${locale} : noms en double`).toBe(118)
  })

  it('espagnol : article des noms d’éléments (« del hierro », « de la plata »)', () => {
    const es = makeDatasetI18n(elementsI18n, 'es')
    expect(es.ofSubject('Fer')).toBe('del hierro')
    expect(es.ofSubject('Argent')).toBe('de la plata')
  })

  it('exemples de noms traduits', () => {
    expect(makeDatasetI18n(elementsI18n, 'es').value('Hydrogène')).toBe('Hidrógeno')
    expect(makeDatasetI18n(elementsI18n, 'nl').value('Fer')).toBe('IJzer')
    expect(makeDatasetI18n(elementsI18n, 'ht').value('Or')).toBe('Lò')
  })

  it.each(LOCALES)('%s : « Écouter » (fiche et présentation) et titre existent', (locale) => {
    expect(dataset.speech?.[locale]?.length, 'speech').toBe(10)
    expect(dataset.intro?.[locale]?.length, 'intro').toBe(8)
    expect(dataset.titles?.[locale], 'titre').toBeTruthy()
    expect(dataset.nouns?.[locale], 'nom commun').toBeTruthy()
  })

  it.each(LOCALES)('%s : les gabarits « Écouter » ne citent que des colonnes qui existent', (locale) => {
    const columns = new Set(Object.keys(rows[0]))
    for (const sentence of dataset.speech![locale]!) {
      for (const [, name] of sentence.matchAll(/\{(\w+)(?::\d+)?\}/g)) {
        expect(name === 'Name' || name === 'of_name' || columns.has(name), `${locale} : {${name}}`).toBe(true)
      }
    }
  })

  it.each(LOCALES)('%s : même nombre de phrases par gabarit, mêmes champs que le français', (locale) => {
    const fields = (sentence: string) => [...sentence.matchAll(/\{(\w+)(?::\d+)?\}/g)].map((m) => m[1])
    const reference = dataset.speech!.fr!.map(fields)
    expect(dataset.speech![locale]!.map(fields)).toEqual(reference)
  })

  it.each(LOCALES)('%s : la présentation cite le nombre d’éléments', (locale) => {
    expect(dataset.intro![locale]!.join(' ')).toContain('118')
    expect(dataset.intro![locale]!.join(' ')).not.toContain('{COUNT}')
  })

  it.each(TRANSLATED)('%s : un quiz généré ne contient aucun nom d’élément français résiduel pour un nom traduit', (locale) => {
    const schema = inferSchema(rows)
    const quiz = generateQuiz(rows, schema, { seed: 'i18n', locale, i18n: elementsI18n })
    const t = makeDatasetI18n(elementsI18n, locale)
    const translatedOnly = rows.map((row) => row.element).filter((name) => t.value(name) !== name)
    const text = quiz.questions.map((question) => question.question).join('\n')
    // Hydrogène (fr) ne doit pas apparaître dans l’énoncé d’une question en es / nl / ht / en.
    expect(text).not.toMatch(new RegExp(`\b${translatedOnly[0]}\b`))
    expect(quiz.questions.length).toBeGreaterThan(100)
  })
})
