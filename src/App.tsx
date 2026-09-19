import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import elementsCsv from './data/elements.csv?raw'
import { elementsI18n } from './data/elements.i18n'
import { ChartBackground } from './components/ChartBackground'
import { FilterPanel } from './components/FilterPanel'
import { HistoryPage } from './components/HistoryPage'
import { ProfilePage } from './components/ProfilePage'
import { AtlasPage } from './components/AtlasPage'
import { PeriodicTablePage } from './components/PeriodicTablePage'
import { FicheModal } from './components/FicheModal'
import { QuizContentPage } from './components/QuizContentPage'
import { QuizPage, type GameMode } from './components/QuizPage'
import { ResultPage } from './components/ResultPage'
import type { AnswersByQuestion, Difficulty, Quiz, Question } from './types/quiz'
import type { Profile } from './types/profile'
import { LocaleProvider, useLocale, useT } from './i18n'
import { applyLocale, DEFAULT_LOCALE, resolveLocale, type Locale } from './i18n/locale'
import type { DataI18n } from './i18n/data'
import { buildQuestionResultPayloads, buildQuizResultPayload, saveQuestionResults, saveQuizResult } from './utils/quizHistory'
import { fetchProfile, saveProfile } from './utils/profile'
import { applyElementsSchemaConfig, fetchElementsDataset, fetchElementsSchemaConfig, toElementsSchemaConfig, updateElementsSchemaConfig, type ElementsSchemaConfig } from './utils/elementsDataset'
import { checkIsAdmin } from './utils/adminAccess'
import { applyTheme } from './utils/theme'
import { parseQuiz } from './utils/quizValidation'
import { formatNumber } from './utils/number'
import { generateQuiz, inferSchema, parseCsv, randomSeed } from './utils/quizGenerator'
import type { GenSchema, Row } from './utils/quizGenerator'
import { isSoundMuted, playClick, setSoundMuted } from './utils/sound'
import { shuffle } from './utils/shuffle'

type View = 'start' | 'quiz' | 'results' | 'content' | 'history' | 'profile' | 'atlas' | 'table'
type Dataset = {
  rows: Row[]
  schema: GenSchema
  aliases?: Record<string, string[]>
  /** Colonnes symbole / numéro / catégorie / groupe / période (tuiles de fiche et vue Tableau) : le jeu
   * de données embarqué en a, un CSV importé non. */
  elementColumns?: { symbol: string; number: string; category: string; group: string; period: string }
  i18n?: DataI18n
  /** Nom d'un élément par locale (le CSV n'a pas cette info) ; défaut = `schema.noun`. */
  nouns?: Partial<Record<Locale, string>>
  /** Titre du quiz par locale ; défaut = `schema.title`. La clé d'historique reste `schema.title`. */
  titles?: Partial<Record<Locale, string>>
  /** Vrai uniquement pour le dataset des éléments construit depuis Supabase (buildElementsDataset) :
   *  seul celui-ci a une table éditable en face, donc seul lui autorise l'édition admin des fiches. */
  editable?: boolean
}

const questionCounts = [5, 10, 20, 30, 50]
/** Durées proposées pour le contre-la-montre, en minutes ; 0 = illimité. */
const timeAttackDurations = [5, 10, 15, 20, 0]

const FALLBACK_QUIZ: Quiz = {
  version: '1.0',
  metadata: { title: 'Periodic Quiz', author: 'Periodic Quiz', createdAt: '2026-09-19', description: 'Importe un CSV pour générer un quiz.' },
  categories: [{ id: 'dataset', label: 'Periodic Quiz' }],
  questions: [],
}

/** Clé stable d'un jeu de données pour l'agrégation d'historique (indépendante de la langue). */
function historyKeyOf(dataset: Dataset | null, quiz: Quiz): string {
  return dataset ? dataset.schema.title : quiz.metadata.title
}

function safeGenerate(dataset: Dataset, seed: string, locale: Locale = DEFAULT_LOCALE): { quiz: Quiz; error: string } {
  const schema = {
    ...dataset.schema,
    ...(dataset.nouns?.[locale] ? { noun: dataset.nouns[locale] } : {}),
    ...(dataset.titles?.[locale] ? { title: dataset.titles[locale] } : {}),
  }
  try {
    return {
      quiz: parseQuiz(generateQuiz(dataset.rows, schema, {
        seed, locale, i18n: dataset.i18n, aliases: dataset.aliases,
      })),
      error: '',
    }
  } catch (error) {
    return { quiz: FALLBACK_QUIZ, error: error instanceof Error ? error.message : 'Génération impossible.' }
  }
}

/** Construit le jeu de données des éléments à partir de lignes CSV — même forme que les lignes
 *  viennent du fichier embarqué (démarrage) ou de Supabase (bascule silencieuse une fois le fetch
 *  arrivé, voir elementsDataset.ts) : elements.i18n.ts reste du code statique, indexé par le nom
 *  français exact des éléments et certaines valeurs de cellules (catégories, états). */
function buildElementsDataset(rows: Row[], schemaConfig: ElementsSchemaConfig | null = null): Dataset {
  const baseSchema = { ...inferSchema(rows), noun: 'élément', title: 'Le tableau périodique des éléments' }
  return {
    rows,
    schema: applyElementsSchemaConfig(baseSchema, schemaConfig),
    elementColumns: { symbol: 'symbole', number: 'numero_atomique', category: 'categorie', group: 'groupe', period: 'periode' },
    i18n: elementsI18n,
    nouns: { fr: 'élément', en: 'element', es: 'elemento', nl: 'element', ht: 'eleman' },
    titles: {
      fr: 'Le tableau périodique des éléments',
      en: 'The periodic table of elements',
      es: 'La tabla periódica de los elementos',
      nl: 'Het periodiek systeem der elementen',
    },
    editable: true,
  }
}

const bundledRows = (() => {
  try { return parseCsv(elementsCsv) } catch { return [] as Row[] }
})()
const initialDataset: Dataset | null = bundledRows.length ? buildElementsDataset(bundledRows) : null
const initialQuiz = initialDataset ? safeGenerate(initialDataset, 'elements').quiz : FALLBACK_QUIZ

function pickRandomQuestions<T>(questions: T[], count: number): T[] {
  return shuffle(questions).slice(0, Math.min(count, questions.length))
}

export default function App({ session }: { session: Session | null }) {
  const userId = session?.user.id ?? null
  const [profile, setProfile] = useState<Profile | null>(null)
  useEffect(() => { fetchProfile(userId).then(setProfile).catch(() => {}) }, [userId])
  const [dbData, setDbData] = useState<{ rows: Row[]; schemaConfig: ElementsSchemaConfig | null } | null>(null)
  useEffect(() => {
    Promise.all([fetchElementsDataset(), fetchElementsSchemaConfig()])
      .then(([rows, schemaConfig]) => { if (rows?.length) setDbData({ rows, schemaConfig }) })
      .catch(() => {})
  }, [])
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return }
    checkIsAdmin().then(setIsAdmin).catch(() => setIsAdmin(false))
  }, [userId])
  const locale = resolveLocale(profile?.locale)
  useEffect(() => { applyLocale(locale) }, [locale])
  return (
    <LocaleProvider locale={locale}>
      <AppInner profile={profile} onProfileChange={setProfile} session={session} dbData={dbData} isAdmin={isAdmin} />
    </LocaleProvider>
  )
}

function AppInner({ profile, onProfileChange, session, dbData, isAdmin }: { profile: Profile | null; onProfileChange: (p: Profile) => void; session: Session | null; dbData: { rows: Row[]; schemaConfig: ElementsSchemaConfig | null } | null; isAdmin: boolean }) {
  const t = useT()
  const locale = useLocale()
  const tRef = useRef(t)
  tRef.current = t
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz)
  const [dataset, setDataset] = useState<Dataset | null>(initialDataset)
  // Tirage courant : seed + locale ayant produit `quiz`. `initialQuiz` = seed « elements » en FR.
  const genRef = useRef<{ seed: string; locale: Locale }>({ seed: 'elements', locale: DEFAULT_LOCALE })
  const [ficheSubject, setFicheSubject] = useState<string | null>(null)
  const [genError, setGenError] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [view, setView] = useState<View>('start')
  const [answers, setAnswers] = useState<AnswersByQuestion>({})
  const [fileError, setFileError] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [timeAttackMinutes, setTimeAttackMinutes] = useState(10)
  // Mode/limite de temps figés au lancement (`startQuiz`/`replayMissed`), indépendants des réglages
  // du panneau de démarrage qui restent modifiables pendant la partie sans l'affecter.
  const [activeMode, setActiveMode] = useState<GameMode>('classic')
  const [activeTimeLimit, setActiveTimeLimit] = useState<number | undefined>(undefined)
  const [sessionQuestions, setSessionQuestions] = useState<Quiz['questions']>([])
  const [resultQuestions, setResultQuestions] = useState<Quiz['questions']>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [muted, setMuted] = useState(isSoundMuted())
  const theme = profile?.theme ?? 'lagon'
  useEffect(() => { applyTheme(theme) }, [theme])
  const [historyBack, setHistoryBack] = useState<View>('profile')
  const viewHistory = (from: View) => { setHistoryBack(from); navigate('history') }

  // Le back/swipe-back du navigateur doit se comporter comme le bouton "Retour" de l'appli plutôt que la quitter :
  // chaque navigation interne pousse une entrée d'historique, et on resynchronise `view` sur popstate.
  const viewRef = useRef(view)
  useEffect(() => { viewRef.current = view }, [view])
  useEffect(() => {
    window.history.replaceState({ view: 'start' }, '')
    const onPopState = (event: PopStateEvent) => {
      const nextView = (event.state?.view as View | undefined) ?? 'start'
      if (viewRef.current === 'quiz' && nextView !== 'quiz') {
        if (!window.confirm(tRef.current('quiz.abandonConfirm'))) {
          window.history.pushState({ view: 'quiz' }, '')
          return
        }
        setAnswers({}); setSessionQuestions([]); setElapsedSeconds(0)
      }
      setView(nextView)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const navigate = (next: View) => { setView(next); window.history.pushState({ view: next }, '') }
  // Remplace l'entrée d'historique courante plutôt que d'en empiler une nouvelle : utilisé pour quitter
  // "quiz" (fin de partie ou abandon), qui n'est pas un état vers lequel on veut pouvoir revenir en arrière.
  const replace = (next: View) => { setView(next); window.history.replaceState({ view: next }, '') }
  const filteredQuestions = useMemo(() => quiz.questions.filter((question) =>
    (!selectedCategories.length || selectedCategories.includes(question.category)) && (!difficulty || question.difficulty === difficulty)), [quiz, selectedCategories, difficulty])

  const toggleCategory = (categoryId: string) => setSelectedCategories((previous) =>
    previous.includes(categoryId) ? previous.filter((id) => id !== categoryId) : [...previous, categoryId])

  const applyQuiz = (next: Quiz) => {
    setQuiz(next)
    setSelectedCategories([]); setDifficulty(''); setSessionQuestions([])
  }

  const applyGenerated = (nextDataset: Dataset, seed: string) => {
    const { quiz: next, error } = safeGenerate(nextDataset, seed, locale)
    setGenError(error)
    if (!error) {
      genRef.current = { seed, locale }
      applyQuiz(next)
    }
  }

  // Changement de langue : on régénère le quiz courant (données + formulations traduites) avec le
  // même seed, pour une bascule immédiate. Le `subject`/`id` des questions restent FR → l'historique suit.
  useEffect(() => {
    if (dataset && genRef.current.locale !== locale) applyGenerated(dataset, genRef.current.seed)
  }, [locale, dataset]) // applyGenerated volontairement hors deps : ne dépend que de (locale, dataset)

  // Bascule silencieuse vers le dataset Supabase (éditable sans redéploiement, cf. elementsDataset.ts)
  // dès qu'il arrive — seulement si l'utilisateur n'a pas depuis importé son propre CSV (auquel cas
  // `dataset` n'est plus le dataset Caraïbes éditable, `editable` n'y est pas défini).
  useEffect(() => {
    if (dbData?.rows.length && dataset?.editable) {
      const nextDataset = buildElementsDataset(dbData.rows, dbData.schemaConfig)
      setDataset(nextDataset)
      applyGenerated(nextDataset, genRef.current.seed)
    }
  }, [dbData]) // volontairement seul en deps : ne doit se déclencher qu'à l'arrivée de dbData

  // Un admin a corrigé un champ depuis une fiche (FicheModal) : on met à jour la ligne concernée
  // dans le dataset en mémoire et on régénère le quiz courant (même seed), sans nouvel aller-retour
  // réseau — la ligne modifiée vient déjà de la réponse de sauvegarde.
  const handleDatasetRowUpdated = (updatedRow: Row) => {
    if (!dataset) return
    const canonical = updatedRow[dataset.schema.subjectColumn]
    const nextDataset = { ...dataset, rows: dataset.rows.map((row) => row[dataset.schema.subjectColumn] === canonical ? updatedRow : row) }
    setDataset(nextDataset)
    applyGenerated(nextDataset, genRef.current.seed)
  }

  const loadCsv = async (file?: File) => {
    if (!file) return
    try {
      const rows = parseCsv(await file.text())
      if (!rows.length) throw new Error('CSV vide ou illisible.')
      const nextDataset: Dataset = { rows, schema: inferSchema(rows) }
      setDataset(nextDataset)
      setFileError('')
      setGenError('')
      applyGenerated(nextDataset, randomSeed())
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'CSV invalide.')
    }
  }

  const generateFromPanel = (schema: GenSchema, seed: string) => {
    if (!dataset) return
    const nextDataset: Dataset = { ...dataset, schema }
    setDataset(nextDataset)
    applyGenerated(nextDataset, seed)
    navigate('start')
    // Admin sur le dataset Caraïbes : les réglages du panneau (colonnes incluses/séparateur, nom,
    // titre) deviennent le défaut partagé, pas seulement ce tirage — best-effort, jamais bloquant.
    if (dataset.editable && isAdmin) updateElementsSchemaConfig(toElementsSchemaConfig(schema)).catch(() => {})
  }

  // Reconstruit le pool de questions depuis les mêmes données, avec un nouveau seed :
  // autres distracteurs, autres énoncés Vrai/Faux, autres regroupements de classement.
  const regenerateQuestions = () => {
    if (!dataset) return
    playClick()
    applyGenerated(dataset, randomSeed())
  }

  const startQuiz = () => {
    playClick()
    setAnswers({})
    setActiveMode(gameMode)
    if (gameMode === 'classic') {
      setActiveTimeLimit(undefined)
      setSessionQuestions(pickRandomQuestions(filteredQuestions, questionCount))
    } else {
      setActiveTimeLimit(gameMode === 'timeAttack' && timeAttackMinutes > 0 ? timeAttackMinutes * 60 : undefined)
      setSessionQuestions(shuffle(filteredQuestions))
    }
    navigate('quiz')
  }

  const replayMissed = (questions: Question[]) => {
    playClick()
    setAnswers({})
    setActiveMode('classic')
    setActiveTimeLimit(undefined)
    setSessionQuestions(questions)
    navigate('quiz')
  }

  const backToStart = () => {
    setAnswers({})
    setSessionQuestions([])
    setResultQuestions([])
    setElapsedSeconds(0)
    replace('start')
  }

  const toggleSound = () => {
    setSoundMuted(!muted)
    setMuted(!muted)
  }

  return <main className="app-shell">
    <ChartBackground />
    <header><div><p className="eyebrow">PERIODIC QUIZ</p><h1>{quiz.metadata.title}</h1><p>{t('header.by', { author: quiz.metadata.author })}</p>{view === 'start' && quiz.metadata.description && <p className="quiz-description-preview">{quiz.metadata.description}</p>}</div><div className="header-actions"><button type="button" className="secondary" onClick={toggleSound} aria-label={muted ? t('header.soundOn') : t('header.soundOff')}>{muted ? '🔇' : '🔊'}</button>{view === 'start' && <button type="button" className="secondary" onClick={() => navigate('profile')}>{profile ? `${profile.avatar} ${profile.pseudo}` : `👤 ${t('nav.profile')}`}</button>}{view === 'start' && dataset?.elementColumns && <button type="button" className="secondary" onClick={() => navigate('table')}>🧪 {t('nav.table')}</button>}{view === 'start' && dataset && <button type="button" className="secondary" onClick={() => navigate('atlas')}>🗂️ {t('nav.fiches')}</button>}{view === 'start' && <button type="button" className="secondary" onClick={() => navigate('content')}>⚙️ {t('nav.quiz')}</button>}</div></header>
    {view === 'start' && <section className="start-page">
      <FilterPanel categories={quiz.categories} selectedCategories={selectedCategories} difficulty={difficulty} onCategoryToggle={toggleCategory} onDifficultyChange={setDifficulty} />
      <div className="mode-toggle" role="radiogroup" aria-label={t('start.mode.aria')}>
        <label className={gameMode === 'classic' ? 'mode-chip is-active' : 'mode-chip'}>
          <input type="radio" name="game-mode" checked={gameMode === 'classic'} onChange={() => { playClick(); setGameMode('classic') }} />
          🎯 {t('start.mode.classic')}
        </label>
        <label className={gameMode === 'timeAttack' ? 'mode-chip is-active' : 'mode-chip'}>
          <input type="radio" name="game-mode" checked={gameMode === 'timeAttack'} onChange={() => { playClick(); setGameMode('timeAttack') }} />
          ⏱️ {t('start.mode.timeAttack')}
        </label>
        <label className={gameMode === 'noMistake' ? 'mode-chip is-active' : 'mode-chip'}>
          <input type="radio" name="game-mode" checked={gameMode === 'noMistake'} onChange={() => { playClick(); setGameMode('noMistake') }} />
          🔥 {t('start.mode.noMistake')}
        </label>
      </div>
      {gameMode === 'classic' && <>
        <label className="question-count">{t('start.questionCount')}<select value={questionCount} onChange={(event) => { playClick(); setQuestionCount(Number(event.target.value)) }}>{questionCounts.map((count) => <option key={count} value={count} disabled={count > filteredQuestions.length}>{t(count === 1 ? 'start.count.one' : 'start.count.other', { n: count })}{count > filteredQuestions.length ? t('start.unavailableSuffix') : ''}</option>)}<option value={filteredQuestions.length}>{t('start.allQuestions', { n: formatNumber(filteredQuestions.length) })}</option></select></label>
        <p>{t('start.availability', { n: formatNumber(filteredQuestions.length), picked: Math.min(questionCount, filteredQuestions.length) })}</p>
      </>}
      {gameMode === 'timeAttack' && <>
        <label className="question-count">{t('start.duration')}<select value={timeAttackMinutes} onChange={(event) => { playClick(); setTimeAttackMinutes(Number(event.target.value)) }}>{timeAttackDurations.map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? t('start.duration.infinite') : t(minutes === 1 ? 'start.duration.one' : 'start.duration.other', { n: minutes })}</option>)}</select></label>
        <p>{t('start.timeAttackHint', { n: formatNumber(filteredQuestions.length) })}</p>
      </>}
      {gameMode === 'noMistake' && <p>{t('start.noMistakeHint', { n: formatNumber(filteredQuestions.length) })}</p>}
      <div className="quiz-actions"><button type="button" onClick={startQuiz} disabled={!filteredQuestions.length}>{t('start.play')}</button></div>
    </section>}
    {view === 'quiz' && <QuizPage quiz={quiz} questions={sessionQuestions} mode={activeMode} timeLimitSeconds={activeTimeLimit} onFinish={(nextAnswers, duration, shown) => {
      setAnswers(nextAnswers); setResultQuestions(shown); setElapsedSeconds(duration); replace('results')
      const historyKey = historyKeyOf(dataset, quiz)
      saveQuizResult(buildQuizResultPayload(shown, nextAnswers, quiz.categories, duration, historyKey, activeMode), session?.user.id)
      saveQuestionResults(buildQuestionResultPayloads(shown, nextAnswers, historyKey), session?.user.id)
    }} onCancel={backToStart} />}
    {view === 'results' && <ResultPage questions={resultQuestions} answers={answers} categories={quiz.categories} elapsedSeconds={elapsedSeconds} onRestart={backToStart} onViewHistory={() => viewHistory('results')} onViewFiche={dataset ? setFicheSubject : undefined} />}
    {view === 'content' && <QuizContentPage quiz={quiz} dataset={dataset} onBack={() => navigate('start')} onCsvChange={loadCsv} onGenerate={generateFromPanel} onRegenerate={regenerateQuestions} fileError={fileError} genError={genError} />}
    {view === 'atlas' && dataset && <AtlasPage rows={dataset.rows} schema={dataset.schema} tile={dataset.elementColumns} i18n={dataset.i18n} onOpenFiche={setFicheSubject} onBack={() => navigate('start')} />}
    {view === 'table' && dataset?.elementColumns && <PeriodicTablePage rows={dataset.rows} schema={dataset.schema} i18n={dataset.i18n} tile={dataset.elementColumns} groupColumn={dataset.elementColumns.group} periodColumn={dataset.elementColumns.period} onOpenFiche={setFicheSubject} onBack={() => navigate('start')} />}
    {ficheSubject && dataset && (() => {
      const row = dataset.rows.find((r) => r[dataset.schema.subjectColumn] === ficheSubject)
      return row ? <FicheModal row={row} schema={dataset.schema} tile={dataset.elementColumns} i18n={dataset.i18n} canEdit={isAdmin && Boolean(dataset.editable)} onRowUpdated={handleDatasetRowUpdated} onClose={() => setFicheSubject(null)} /> : null
    })()}
    {view === 'history' && <HistoryPage onBack={() => navigate(historyBack)} quiz={quiz} historyKey={historyKeyOf(dataset, quiz)} userId={session?.user.id} onReplayMissed={replayMissed} />}
    {view === 'profile' && <ProfilePage profile={profile} session={session} onBack={() => navigate('start')} onSave={async (next) => { await saveProfile(next, session?.user.id); onProfileChange(next) }} onViewHistory={() => viewHistory('profile')} />}
    <footer className="app-footer">{t('footer.version', { hash: __COMMIT_HASH__ })}</footer>
  </main>
}
