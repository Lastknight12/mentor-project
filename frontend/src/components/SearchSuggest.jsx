import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { ratingLabel } from '../rating.js'

const MIN_CHARS = 2
const DEBOUNCE_MS = 250
const MAX_ITEMS = 5

/**
 * Підказки під рядком пошуку: після 2 символів показує до 5 фільмів
 * із постером. Enter, як і раніше, відкриває повні результати пошуку.
 */
export function SearchSuggest({ term, onPick }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  // Запит із невеликою затримкою, щоб не надсилати його на кожну літеру
  useEffect(() => {
    const query = term.trim()
    if (query.length < MIN_CHARS) {
      setItems([])
      setOpen(false)
      return undefined
    }
    let active = true
    const timer = setTimeout(() => {
      api
        .search({ query })
        .then((data) => {
          if (!active) return
          const list = (data.results || []).slice(0, MAX_ITEMS)
          setItems(list)
          setOpen(list.length > 0)
        })
        .catch(() => {
          if (active) setOpen(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [term])

  // Закриття списку: клік поза пошуком або Escape
  useEffect(() => {
    if (!open) return undefined
    function onDown(event) {
      if (!event.target.closest('.header-search, .mobile-search form, .suggest')) {
        setOpen(false)
      }
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <ul className="suggest" aria-label="Підказки пошуку">
      {items.map((movie) => (
        <li key={movie.id}>
          <Link
            to={`/movie/${movie.id}`}
            onClick={() => {
              setOpen(false)
              onPick?.()
            }}
          >
            <img src={movie.posterUrl} alt="" loading="lazy" />
            <span className="suggest-text">
              <strong>{movie.title}</strong>
              <small>
                {movie.year || '—'} · ★ {ratingLabel(movie)}
              </small>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
