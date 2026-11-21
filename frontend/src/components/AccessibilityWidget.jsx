import { useEffect, useRef, useState } from 'react'
import {
  applyA11y,
  describeElement,
  resetA11y,
  setA11y,
  speak,
  speechSupported,
  stopSpeaking,
  useA11y,
} from '../a11y.js'
import {
  AccessIcon,
  CaptionsIcon,
  ContrastIcon,
  SpeakerIcon,
  TextSizeIcon,
} from './Icons.jsx'

const FONT_LABELS = ['Звичайний', 'Крупний', 'Дуже крупний']

/**
 * Панель доступності в лівому нижньому куті: озвучення, субтитри,
 * розмір тексту і висока контрастність.
 */
export function AccessibilityWidget() {
  const settings = useA11y()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const rootRef = useRef(null)

  // Застосовуємо збережені налаштування одразу після завантаження
  useEffect(() => {
    applyA11y()
  }, [])

  // Озвучення: читаємо елемент під курсором або у фокусі клавіатури
  useEffect(() => {
    if (!settings.voice) return undefined
    let timer = 0
    function onOver(event) {
      clearTimeout(timer)
      timer = setTimeout(() => speak(describeElement(event.target)), 350)
    }
    function onFocus(event) {
      clearTimeout(timer)
      speak(describeElement(event.target))
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('focusin', onFocus)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('focusin', onFocus)
    }
  }, [settings.voice])

  // Закриття панелі: Esc і клік поза нею
  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  function toggleVoice() {
    const next = !settings.voice
    setA11y({ voice: next })
    if (next) {
      const title = document.querySelector('h1')?.innerText || ''
      speak(`Озвучення увімкнено. ${title}`, { force: true })
      setStatus('Озвучення увімкнено')
    } else {
      stopSpeaking()
      setStatus('Озвучення вимкнено')
    }
  }

  function toggleCaptions() {
    const next = !settings.captions
    setA11y({ captions: next })
    setStatus(next ? 'Субтитри увімкнено' : 'Субтитри вимкнено')
  }

  function cycleFont() {
    const next = (settings.font + 1) % 3
    setA11y({ font: next })
    setStatus(`Розмір тексту: ${FONT_LABELS[next]}`)
  }

  function toggleContrast() {
    const next = !settings.contrast
    setA11y({ contrast: next })
    setStatus(next ? 'Висока контрастність увімкнена' : 'Висока контрастність вимкнена')
  }

  function reset() {
    stopSpeaking()
    resetA11y()
    setStatus('Налаштування доступності скинуто')
  }

  const items = [
    {
      key: 'voice',
      label: 'Озвучення',
      hint: speechSupported ? 'Для незрячих' : 'Недоступно у цьому браузері',
      icon: <SpeakerIcon />,
      active: settings.voice,
      disabled: !speechSupported,
      onClick: toggleVoice,
    },
    {
      key: 'captions',
      label: 'Субтитри',
      hint: 'Для глухих',
      icon: <CaptionsIcon />,
      active: settings.captions,
      onClick: toggleCaptions,
    },
    {
      key: 'font',
      label: 'Розмір тексту',
      hint: FONT_LABELS[settings.font],
      icon: <TextSizeIcon />,
      active: settings.font > 0,
      onClick: cycleFont,
    },
    {
      key: 'contrast',
      label: 'Контраст',
      hint: settings.contrast ? 'Увімкнено' : 'Вимкнено',
      icon: <ContrastIcon />,
      active: settings.contrast,
      onClick: toggleContrast,
    },
  ]

  return (
    <div className="a11y" ref={rootRef}>
      {open && (
        <div className="a11y-panel" role="group" aria-label="Доступність">
          <div className="a11y-grid">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`a11y-item ${item.active ? 'is-active' : ''}`}
                aria-pressed={item.active}
                disabled={item.disabled}
                onClick={item.onClick}
              >
                {item.icon}
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </button>
            ))}
          </div>
          <button type="button" className="a11y-reset" onClick={reset}>
            Скинути налаштування
          </button>
        </div>
      )}
      <button
        type="button"
        className="a11y-toggle"
        aria-expanded={open}
        aria-label="Доступність: озвучення, субтитри, розмір тексту, контраст"
        title="Доступність"
        onClick={() => setOpen((value) => !value)}
      >
        <AccessIcon />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  )
}
