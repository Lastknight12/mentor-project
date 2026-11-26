import { useEffect, useState } from 'react'

const SHOW_AFTER_MS = 1500 // якщо сервер відповів швидше — екран не показуємо
const RETRY_MS = 3000
const ATTEMPT_TIMEOUT_MS = 8000
const SLOW_AFTER_S = 75

async function ping() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS)
  try {
    const response = await fetch('/api/health', { signal: controller.signal })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Безкоштовний хостинг «засинає» без запитів. Поки сервер прокидається,
 * показуємо зрозумілий екран замість порожньої сторінки чи помилки.
 */
export function ServerWakeup() {
  const [visible, setVisible] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let cancelled = false
    let retryTimer = 0
    let tickTimer = 0
    const startedAt = Date.now()

    const showTimer = setTimeout(() => {
      if (cancelled) return
      setVisible(true)
      tickTimer = setInterval(() => {
        setSeconds(Math.round((Date.now() - startedAt) / 1000))
      }, 1000)
    }, SHOW_AFTER_MS)

    async function check() {
      const ok = await ping()
      if (cancelled) return
      if (ok) {
        clearTimeout(showTimer)
        clearInterval(tickTimer)
        setVisible(false)
        return
      }
      retryTimer = setTimeout(check, RETRY_MS)
    }
    check()

    return () => {
      cancelled = true
      clearTimeout(showTimer)
      clearTimeout(retryTimer)
      clearInterval(tickTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="wakeup" role="status" aria-live="polite">
      <div className="wakeup-card">
        <span className="wakeup-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <h2>Прокидаємося після сну…</h2>
        <p>
          Сайт працює на безкоштовному сервері, який «засинає» без відвідувачів.
          Це займе до хвилини, далі все буде швидко.
        </p>
        <span className="wakeup-timer">Очікуємо: {seconds} с</span>
        {seconds >= SLOW_AFTER_S && (
          <p className="wakeup-slow">
            Довше, ніж зазвичай. Якщо нічого не змінюється, оновіть сторінку.
          </p>
        )}
      </div>
    </div>
  )
}
