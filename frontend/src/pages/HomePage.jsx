import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { FilterBar } from '../components/FilterBar.jsx'
import {
  ArrowUpRightIcon,
  CalendarIcon,
  FilmIcon,
  PlayIcon,
  StarIcon,
} from '../components/Icons.jsx'
import { LoadingGrid } from '../components/Loaders.jsx'
import { MovieCard } from '../components/MovieCard.jsx'
import { Pagination } from '../components/Pagination.jsx'

function Hero({ movie }) {
  return (
    <section className="hero">
      <img
        className="hero-backdrop"
        src={movie.backdropUrl}
        alt=""
        fetchPriority="high"
      />
      <div className="hero-overlay" />
      <div className="hero-orbit hero-orbit-one" />
      <div className="hero-orbit hero-orbit-two" />

      <div className="hero-content">
        <span className="hero-label">
          <span className="pulse-dot" />
          Вибір редакції
        </span>
        <h1>{movie.title}</h1>
        <div className="hero-meta">
          <span className="hero-rating">
            <StarIcon size={16} />
            {movie.rating ? movie.rating.toFixed(1) : '—'}
          </span>
          <span>
            <CalendarIcon size={16} />
            {movie.year || '—'}
          </span>
          {movie.genres?.slice(0, 3).map((genre) => (
            <span key={genre.id}>{genre.name}</span>
          ))}
        </div>
        <p className="hero-overview">{movie.overview}</p>
        <div className="hero-actions">
          <Link className="button button-primary" to={`/movie/${movie.id}`}>
            <PlayIcon size={17} />
            Дивитися деталі
          </Link>
          <Link className="button button-ghost" to="/?sort=rating_desc">
            <StarIcon size={16} />
            Топ рейтингу
          </Link>
        </div>
      </div>

      <div className="hero-score">
        <span>Рейтинг</span>
        <strong>{movie.rating ? movie.rating.toFixed(1) : '—'}</strong>
        <small>з 10</small>
      </div>

      <div className="hero-footer-line">
        <span>CineScope selection</span>
        <span>{movie.originalTitle}</span>
      </div>
    </section>
  )
}

function EmptyState({ query, onReset }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <FilmIcon size={32} />
      </span>
      <h2>{query ? 'Нічого не знайдено' : 'У цій добірці поки порожньо'}</h2>
      <p>
        {query
          ? `За запитом «${query}» фільмів не знайдено. Спробуйте іншу назву або змініть фільтри.`
          : 'Спробуйте змінити жанр, рік або мінімальний рейтинг.'}
      </p>
      <button type="button" className="button button-primary" onClick={onReset}>
        Показати всі фільми
      </button>
    </div>
  )
}

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    totalResults: 0,
  })

  const query = searchParams.get('q') || ''
  const genreId = searchParams.get('genre') || ''
  const year = searchParams.get('year') || ''
  const minRating = searchParams.get('minRating') || ''
  const sort = searchParams.get('sort') || 'popularity_desc'
  const page = Number(searchParams.get('page')) || 1

  const filters = { query, genreId, year, minRating, sort }
  const isDefaultView =
    !query &&
    !genreId &&
    !year &&
    !minRating &&
    sort === 'popularity_desc' &&
    page === 1

  useEffect(() => {
    let active = true
    api
      .genres()
      .then((data) => {
        if (active) setGenres(data.genres || [])
      })
      .catch(() => {
        if (active) setGenres([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    const params = {
      page,
      genre: genreId,
      year,
      minRating,
      sort,
      query,
    }
    const loader = query ? api.search : api.movies

    loader(params)
      .then((data) => {
        if (!active) return
        setMovies(data.results || [])
        setMeta({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || 0,
        })
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message)
        setMovies([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [query, genreId, year, minRating, sort, page])

  const featured = useMemo(
    () => (isDefaultView && !loading ? movies[0] : null),
    [isDefaultView, loading, movies],
  )

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key)
      else next.set(key, String(value))
    })
    if (!Object.hasOwn(changes, 'page')) next.delete('page')
    setSearchParams(next)
  }

  function handleFilters(change) {
    const map = {
      genreId: 'genre',
      year: 'year',
      minRating: 'minRating',
      sort: 'sort',
    }
    const entries = Object.entries(change)
    const mapped = Object.fromEntries(
      entries.map(([key, value]) => [map[key] || key, value]),
    )
    updateParams(mapped)
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams())
  }

  function goToPage(nextPage) {
    updateParams({ page: nextPage })
    document
      .getElementById('catalog')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="home-page">
      {featured && <Hero movie={featured} />}

      <section className="catalog-section" id="catalog">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              <FilmIcon size={16} />
              {query ? 'Пошук' : 'Каталог'}
            </span>
            <h2>
              {query
                ? `Результати для «${query}»`
                : isDefaultView
                  ? 'Зараз у центрі уваги'
                  : 'Добірка за вашими фільтрами'}
            </h2>
          </div>
          <Link className="section-link" to="/?sort=rating_desc">
            Дивитися топ
            <ArrowUpRightIcon size={17} />
          </Link>
        </div>

        <FilterBar
          filters={filters}
          genres={genres}
          onChange={handleFilters}
          onReset={resetFilters}
          shown={loading ? null : meta.totalResults}
        />

        {error && (
          <div className="error-banner">
            <strong>Не вдалося завантажити каталог.</strong>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingGrid />
        ) : movies.length ? (
          <>
            <div className="movie-grid">
              {movies.map((movie) => (
                <MovieCard movie={movie} key={movie.id} />
              ))}
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={goToPage}
            />
          </>
        ) : (
          !error && <EmptyState query={query} onReset={resetFilters} />
        )}
      </section>

      <section className="catalog-cta">
        <div>
          <span className="eyebrow">Своя полиця</span>
          <h2>Зберігайте фільми, до яких хочете повернутися</h2>
          <p>
            Додавайте стрічки в обране та діліться власними рецензіями з
            кіноспільнотою CineScope.
          </p>
        </div>
        <Link className="button button-primary" to="/favorites">
          Перейти до обраного
          <ArrowUpRightIcon size={17} />
        </Link>
      </section>
    </div>
  )
}
