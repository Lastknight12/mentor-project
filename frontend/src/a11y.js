import { useSyncExternalStore } from 'react'

// Налаштування доступності: зберігаються в браузері й застосовуються до всього сайту.
const KEY = 'cinescope_a11y'
const defaults = { voice: false, captions: false, font: 0, contrast: false }

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaults }
  }
}

let state = load()
const listeners = new Set()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // збереження недоступне — налаштування діятимуть до перезавантаження
  }
}

export function applyA11y() {
  const root = document.documentElement
  root.classList.toggle('a11y-contrast', state.contrast)
  root.classList.toggle('a11y-font-1', state.font === 1)
  root.classList.toggle('a11y-font-2', state.font === 2)
}

export function getA11y() {
  return state
}

export function setA11y(patch) {
  state = { ...state, ...patch }
  save()
  applyA11y()
  listeners.forEach((listener) => listener())
}

export function resetA11y() {
  setA11y({ ...defaults })
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useA11y() {
  return useSyncExternalStore(subscribe, getA11y, getA11y)
}

// ---------- Озвучення (Web Speech API) ----------
export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window

let lastSpoken = ''

export function speak(text, { force = false } = {}) {
  if (!speechSupported) return
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500)
  if (!clean) return
  if (!force && clean === lastSpoken && window.speechSynthesis.speaking) return
  lastSpoken = clean
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = 'uk-UA'
  const voice = window.speechSynthesis
    .getVoices()
    .find((item) => item.lang && item.lang.toLowerCase().startsWith('uk'))
  if (voice) utterance.voice = voice
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel()
  lastSpoken = ''
}

// Текст елемента, який треба озвучити (підпис, alt, значення поля або вміст)
export function describeElement(node) {
  const element = node?.closest?.(
    '[aria-label], a, button, select, input, textarea, h1, h2, h3, h4, p, img, label, li',
  )
  if (!element || element.closest('[data-no-voice]')) return ''
  const tag = element.tagName
  if (tag === 'IMG') return element.getAttribute('alt') || ''
  if (tag === 'SELECT') {
    const name =
      element.getAttribute('aria-label') ||
      element.closest('label')?.querySelector('span')?.textContent ||
      ''
    const chosen = element.options?.[element.selectedIndex]?.textContent || ''
    return `${name}: ${chosen}`
  }
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    const name =
      element.getAttribute('aria-label') ||
      element.getAttribute('placeholder') ||
      ''
    return element.value ? `${name}: ${element.value}` : `${name}, поле вводу`
  }
  return element.getAttribute('aria-label') || element.innerText || ''
}
