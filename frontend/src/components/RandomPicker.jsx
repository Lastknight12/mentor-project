cd /workspaces/mentor-projectimport { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { CloseIcon, DiceIcon, StarIcon } from './Icons.jsx'

/**
 * Вікно «Що подивитися?»: показує випадковий фільм з високим рейтингом.
 * Можна обрати жанр і натиснути «Інший фільм».
 */
export function RandomPicker({ onClose }) {
  const navigate = useNavigate()
  const seen = useRef([])
  const dialogRef = useRef(null)
  const [genres, setGenres] = useState([])
  const [genreId, setGenreId] = useState('')
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pick = useCallback(async (genre) => {
    setLoading(true)
    setError('')
    try {
      const result = await api.randomMovie({
        genre: genre || undefined,
        exclude: seen.current.slice(-40).join(','),
      })
      seen.current.push(result.id)
      setMovie(result)
    } catch (err) {
      setMovie(null)
      setError(err.message || 'Не вдалося підібрати фільм')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    pick('')
    api
      .genres()
      .then((data) => setGenres(data.genres || []))
      .catch(() => {})
  }, [pick])

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()
    document.body.style.overflow = 'hidden'
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [onClose])

  function changeGenre(event) {
    setGenreId(event.target.value)
    pick(event.target.value)
  }

  function openMovie() {
    if (!movie) return
    onClose()
    navigate(`/movie/${movie.id}`)
  }

  return createPortal(
    <div className="picker-backdrop" onMouseDown={onClose}>
      <div
        className="picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="picker-close"
          onClick={onClose}
          aria-label="Закрити"
        >
          <CloseIcon />
        </button>

        <div className="picker-head">
          <h2 id="picker-title">Що подивитися?</h2>
          <label className="picker-genre">
            <span>Жанр</span>
            <select value={genreId} onChange={changeGenre}>
              <option value="">Будь-який</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && !movie && <p className="picker-note">Підбираємо фільм…</p>}
        {error && <p className="picker-note picker-error">{error}</p>}

        {movie && (
          <div className={`picker-body ${loading ? 'is-loading' : ''}`}>
            <img
              className="picker-poster"
              src={movie.posterUrl}
              alt={`Постер фільму «${movie.title}»`}
            />
            <div className="picker-info">
              <h3>{movie.title}</h3>
              <p className="picker-meta">
                <span className="picker-rating">
                  <StarIcon size={14} /> {movie.rating}
                </span>
                {movie.year && <span>{movie.year}</span>}
                {movie.genres.slice(0, 3).map((genre) => (
                  <span key={genre.id}>{genre.name}</span>
                ))}
              </p>
              <p className="picker-overview">
                {movie.overview || 'Опис цього фільму поки відсутній.'}
              </p>
            </div>
          </div>
        )}

        <div className="picker-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={openMovie}
            disabled={!movie}
          >
            Детальніше
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => pick(genreId)}
            disabled={loading}
          >
            <DiceIcon size={17} />
            Інший фільм
          </button>
        </div>
      </div>
    </div>
  , document.body)
}
