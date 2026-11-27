import { useState } from 'react'

const STORAGE_KEY = 'cinescope_theme'

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark'
}

// Тема зберігається в браузері; початкове значення ставить скрипт в index.html
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme)

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // збереження недоступне — не критично
    }
    setTheme(next)
  }

  return { theme, toggleTheme }
}
