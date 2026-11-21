import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { CloseIcon } from './Icons.jsx'

const STORAGE_KEY = 'cinescope_tour_done'
export const TOUR_EVENT = 'cinescope:tour'

// Кроки екскурсії: для кожного — селектори елемента (беремо перший видимий).
const STEPS = [
  {
    selectors: ['.header-search', '.mobile-search form'],
    title: 'Пошук фільму',
    text: 'Введіть назву фільму й натисніть Enter — сайт покаже всі збіги.',
  },
  {
    selectors: ['.filter-panel'],
    title: 'Фільтри каталогу',
    text: 'Оберіть жанр, рік або мінімальний рейтинг, а також спосіб сортування. Кнопка «Очистити» скидає все.',
  },
  {
    selectors: ['.movie-card'],
    title: 'Картка фільму',
    text: 'Натисніть на постер — відкриється сторінка фільму з описом, трейлером і акторами. Кнопка «Дивитися» веде до перегляду.',
  },
  {
    selectors: ['.random-btn', '.mobile-random'],
    title: 'Не знаєте, що обрати?',
    text: 'Кнопка «Що подивитися?» підбере випадковий фільм із високим рейтингом. Можна обрати жанр.',
  },
  {
    selectors: ['.main-nav a[href="/quiz"]'],
    title: 'Вікторина',
    text: 'Перевірте, як добре ви знаєте кіно: 10 питань за кадрами й описами фільмів, а в кінці — цікавий факт про кіно.',
  },
  {
    selectors: ['.main-nav a[href="/favorites"]', '.user-chip', '.header-actions .text-link'],
    title: 'Обране',
    text: 'Додавайте фільми в обране сердечком, щоб повернутися до них пізніше. Для цього потрібен акаунт: вхід і реєстрація — у шапці сайту.',
  },
  {
    selectors: ['.a11y-toggle'],
    title: 'Доступність',
    text: 'Кнопка для всіх: озвучення сторінки голосом, субтитри, збільшення тексту і висока контрастність. Налаштування запам’ятовуються.',
  },
  {
    selectors: ['.help-btn'],
    title: 'Потрібна підказка?',
    text: 'Натисніть «?» у будь-який момент, щоб пройти екскурсію ще раз.',
  },
]

function isVisible(element) {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  if (rect.width < 4 || rect.height < 4) return false
  return getComputedStyle(element).visibility !== 'hidden'
}

function findTarget(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (isVisible(element)) return element
  }
  return null
}

function readDone() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // збереження недоступне — не критично
  }
}

/**
 * Екскурсія по сайту: привітання при першому візиті й підсвічені кроки.
 * Запускається повторно кнопкою «Як користуватися» в шапці.
 */
export function GuideTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState('idle') // idle | welcome | steps
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const targetRef = useRef(null)
  const tooltipRef = useRef(null)
  const [tooltipStyle, setTooltipStyle] = useState({})

  const close = useCallback(() => {
    writeDone()
    setPhase('idle')
    setIndex(0)
    setRect(null)
    targetRef.current = null
  }, [])

  const startSteps = useCallback(() => {
    setIndex(0)
    setRect(null)
    setPhase('steps')
  }, [])

  // Привітання при першому візиті на головній
  useEffect(() => {
    if (readDone() || location.pathname !== '/') return undefined
    const timer = setTimeout(() => setPhase((p) => (p === 'idle' ? 'welcome' : p)), 1400)
    return () => clearTimeout(timer)
  }, [location.pathname])

  // Повторний запуск із шапки
  useEffect(() => {
    function onStart() {
      if (location.pathname !== '/') navigate('/')
      startSteps()
    }
    window.addEventListener(TOUR_EVENT, onStart)
    return () => window.removeEventListener(TOUR_EVENT, onStart)
  }, [location.pathname, navigate, startSteps])

  const step = STEPS[index]

  // Пошук елемента поточного кроку (з очікуванням завантаження сторінки)
  useEffect(() => {
    if (phase !== 'steps') return undefined
    let cancelled = false
    let attempts = 0
    targetRef.current = null
    setRect(null)

    function locate() {
      if (cancelled) return
      const target = findTarget(step.selectors)
      if (target) {
        targetRef.current = target
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        measure()
        return
      }
      const existsHidden = step.selectors.some((selector) => document.querySelector(selector))
      attempts += 1
      if (!existsHidden && attempts < 12) setTimeout(locate, 250)
      else if (index < STEPS.length - 1) setIndex((value) => value + 1)
      else close()
    }

    locate()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index])

  function measure() {
    const target = targetRef.current
    if (!target || !document.contains(target)) return
    const box = target.getBoundingClientRect()
    setRect({
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
    })
  }

  // Оновлення позиції при прокручуванні й зміні розміру
  useEffect(() => {
    if (phase !== 'steps') return undefined
    let frame = 0
    function schedule() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    const timer = setInterval(schedule, 400)
    return () => {
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      clearInterval(timer)
      cancelAnimationFrame(frame)
    }
  }, [phase, index])

  // Позиція підказки
  useLayoutEffect(() => {
    if (phase !== 'steps' || !rect) return
    const tip = tooltipRef.current
    const width = Math.min(340, window.innerWidth - 24)
    const height = tip ? tip.offsetHeight : 180
    if (window.innerWidth < 560) {
      setTooltipStyle({ left: 12, right: 12, bottom: 12, width: 'auto' })
      return
    }
    const gap = 16
    let top = rect.top + rect.height + gap
    if (top + height > window.innerHeight - 12) {
      top = rect.top - height - gap
    }
    if (top < 12) top = Math.min(window.innerHeight - height - 12, 12 + rect.top + rect.height / 2)
    let left = rect.left + rect.width / 2 - width / 2
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
    setTooltipStyle({ top, left, width })
  }, [rect, phase, index])

  // Клавіатура
  useEffect(() => {
    if (phase === 'idle') return undefined
    function onKey(event) {
      if (event.key === 'Escape') close()
      if (phase !== 'steps') return
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index])

  function next() {
    if (index >= STEPS.length - 1) close()
    else setIndex((value) => value + 1)
  }

  function prev() {
    setIndex((value) => Math.max(0, value - 1))
  }

  if (phase === 'idle') return null

  if (phase === 'welcome') {
    return createPortal(
      <div className="picker-backdrop" onMouseDown={close}>
        <div
          className="picker tour-welcome"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-welcome-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button type="button" className="picker-close" onClick={close} aria-label="Закрити">
            <CloseIcon />
          </button>
          <span className="tour-emoji" aria-hidden="true">🎬</span>
          <h2 id="tour-welcome-title">Вітаємо в CineScope!</h2>
          <p>
            Показати, як тут усе працює? Це займе менше хвилини: пошук, фільтри,
            «Що подивитися?», вікторина і панель доступності.
          </p>
          <div className="picker-actions tour-welcome-actions">
            <button type="button" className="button button-primary" onClick={startSteps}>
              Так, покажіть
            </button>
            <button type="button" className="button button-ghost" onClick={close}>
              Ні, дякую
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  const pad = 8
  return createPortal(
    <>
      <div className="tour-blocker" onMouseDown={(event) => event.stopPropagation()} />
      {rect && (
        <div
          className="tour-spot"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}
      <div
        ref={tooltipRef}
        className="tour-tip"
        role="dialog"
        aria-live="polite"
        aria-label={step.title}
        style={rect ? tooltipStyle : { visibility: 'hidden' }}
      >
        <button type="button" className="tour-skip" onClick={close}>
          Пропустити
        </button>
        <span className="tour-count">
          Крок {index + 1} / {STEPS.length}
        </span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour-nav">
          <button type="button" className="button button-ghost button-small" onClick={prev} disabled={index === 0}>
            Назад
          </button>
          <button type="button" className="button button-primary button-small" onClick={next}>
            {index === STEPS.length - 1 ? 'Готово' : 'Далі'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
