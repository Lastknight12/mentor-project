import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { CheckIcon, CloseIcon, PlayIcon } from '../components/Icons.jsx'
import { PageLoader } from '../components/Loaders.jsx'
import { quizFacts } from '../quizFacts.js'

const LETTERS = ['A', 'B', 'C', 'D']

function verdict(score, total) {
  const ratio = total ? score / total : 0
  if (ratio >= 0.9) return 'Справжній кіноман! Ви знаєте кіно як свої п’ять пальців.'
  if (ratio >= 0.6) return 'Чудовий результат! Ви явно багато дивитеся.'
  if (ratio >= 0.3) return 'Непогано! Є що переглянути й чим здивувати друзів.'
  return 'Час наздоганяти! У каталозі багато чудових фільмів.'
}

/**
 * Вікторина «Вгадай фільм»: питання за кадром і описом,
 * потім слайд із цікавим фактом і результат.
 */
export function QuizPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [stage, setStage] = useState('quiz') // quiz | fact | result
  const [fact, setFact] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.quiz({ count: 10 })
      setQuestions(data.questions || [])
      setIndex(0)
      setPicked(null)
      setScore(0)
      setStage('quiz')
      setFact(quizFacts[Math.floor(Math.random() * quizFacts.length)])
    } catch (err) {
      setError(err.message || 'Не вдалося завантажити вікторину')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const question = questions[index]
  const total = questions.length
  const answered = picked !== null
  const isLast = index === total - 1

  function choose(optionId) {
    if (answered || !question) return
    setPicked(optionId)
    if (optionId === question.answerId) setScore((value) => value + 1)
  }

  function next() {
    if (isLast) {
      setStage('fact')
    } else {
      setIndex((value) => value + 1)
      setPicked(null)
    }
  }

  // Гарячі клавіші 1–4 для вибору відповіді
  useEffect(() => {
    if (stage !== 'quiz' || !question) return undefined
    function onKey(event) {
      const number = Number(event.key)
      if (number >= 1 && number <= question.options.length) {
        choose(question.options[number - 1].id)
      }
      if (event.key === 'Enter' && answered) next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, question, answered, index])

  const progress = useMemo(
    () => (total ? ((stage === 'quiz' ? index + (answered ? 1 : 0) : total) / total) * 100 : 0),
    [index, answered, stage, total],
  )

  if (loading) return <PageLoader />

  if (error || !question) {
    return (
      <div className="page-shell quiz">
        <div className="quiz-card quiz-center">
          <h1>Вікторина</h1>
          <p>{error || 'Питань поки немає.'}</p>
          <button type="button" className="button button-primary" onClick={load}>
            Спробувати ще раз
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'fact') {
    return (
      <div className="page-shell quiz">
        <div className="quiz-card quiz-center quiz-fact">
          <span className="quiz-emoji" aria-hidden="true">💡</span>
          <span className="quiz-kicker">А чи знали ви?</span>
          <p className="quiz-fact-text">{fact}</p>
          <button type="button" className="button button-primary" onClick={() => setStage('result')}>
            Дізнатися результат
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'result') {
    return (
      <div className="page-shell quiz">
        <div className="quiz-card quiz-center">
          <span className="quiz-kicker">Ваш результат</span>
          <div className="quiz-score">
            {score}
            <span> / {total}</span>
          </div>
          <p className="quiz-verdict">{verdict(score, total)}</p>
          <div className="quiz-actions">
            <button type="button" className="button button-primary" onClick={load}>
              Спробувати ще раз
            </button>
            <Link className="button button-ghost" to="/">
              До каталогу
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const correct = picked === question.answerId

  return (
    <div className="page-shell quiz">
      <div className="quiz-top">
        <h1>Вікторина</h1>
        <span className="quiz-count">
          Питання {question.number} з {total}
        </span>
      </div>
      <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (answered ? 1 : 0)}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-card">
        <p className="quiz-kicker">
          {question.type === 'frame' ? 'Вгадай фільм за кадром' : 'Вгадай фільм за описом'}
        </p>

        {question.type === 'frame' ? (
          <img className="quiz-frame" src={question.image} alt="Кадр із фільму, назву якого потрібно вгадати" />
        ) : (
          <blockquote className="quiz-plot">{question.text}</blockquote>
        )}

        <div className="quiz-options">
          {question.options.map((option, optionIndex) => {
            let state = ''
            if (answered) {
              if (option.id === question.answerId) state = 'is-correct'
              else if (option.id === picked) state = 'is-wrong'
              else state = 'is-dim'
            }
            return (
              <button
                key={option.id}
                type="button"
                className={`quiz-option ${state}`}
                disabled={answered}
                onClick={() => choose(option.id)}
              >
                <span className="quiz-letter">{LETTERS[optionIndex]}</span>
                <span className="quiz-option-title">{option.title}</span>
                {state === 'is-correct' && <CheckIcon size={18} />}
                {state === 'is-wrong' && <CloseIcon size={18} />}
              </button>
            )
          })}
        </div>

        <div className="quiz-feedback" role="status" aria-live="polite">
          {answered && (
            <div className={`quiz-reveal ${correct ? 'is-right' : 'is-bad'}`}>
              <img src={question.movie.posterUrl} alt="" />
              <div>
                <strong>{correct ? 'Правильно!' : 'Не вгадали'}</strong>
                <p>
                  Це «{question.movie.title}»
                  {question.movie.year ? ` (${question.movie.year})` : ''}.
                </p>
                <Link className="quiz-link" to={`/movie/${question.movie.id}`}>
                  <PlayIcon size={14} /> Сторінка фільму
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="quiz-actions">
          <button type="button" className="button button-primary" onClick={next} disabled={!answered}>
            {isLast ? 'Далі' : 'Наступне питання'}
          </button>
        </div>
      </div>
    </div>
  )
}
