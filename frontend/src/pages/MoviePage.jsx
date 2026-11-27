import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useA11y } from '../a11y.js'
import { hasReliableRating, ratingLabel } from '../rating.js'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  LockIcon,
  PlayIcon,
  StarIcon,
  UserIcon,
} from '../components/Icons.jsx'
import { PageLoader } from '../components/Loaders.jsx'
import { MovieCard } from '../components/MovieCard.jsx'

// «У прокаті» лише для свіжих фільмів; старим показуємо рік виходу.
const NOW_PLAYING_DAYS = 90

function statusLabel(movie) {
  if (movie.status === 'Released') {
    const released = movie.releaseDate ? new Date(movie.releaseDate) : null
    if (released && !Number.isNaN(released.getTime())) {
      const ageDays = (Date.now() - released.getTime()) / 86400000
      if (ageDays <= NOW_PLAYING_DAYS) return 'У прокаті'
    }
    return movie.year ? `Вийшов ${movie.year}` : 'Фільм'
  }
  if (['In Production', 'Post Production', 'Planned', 'Rumored'].includes(movie.status)) {
    return 'Незабаром'
  }
  if (movie.status === 'Canceled') return 'Скасовано'
  return 'Фільм'
}

function formatRuntime(minutes) {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} хв`
  return `${hours} год ${rest ? `${rest} хв` : ''}`.trim()
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function ReviewForm({ movie, onSaved }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [rating, setRating] = useState(movie.myReview?.rating || 8)
  const [text, setText] = useState(movie.myReview?.text || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!movie.myReview) return
    setRating(movie.myReview.rating)
    setText(movie.myReview.text)
  }, [movie.myReview])

  if (!user) {
    return (
      <div className="review-login-card">
        <span className="round-icon">
          <UserIcon size={22} />
        </span>
        <div>
          <h3>Поділіться своєю думкою</h3>
          <p>Увійдіть, щоб залишити оцінку та рецензію до фільму.</p>
        </div>
        <Link
          className="button button-primary button-small"
          to="/login"
          state={{ from: location.pathname }}
        >
          Увійти
        </Link>
      </div>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const data = await api.addReview(movie.id, { rating, text })
      onSaved(data)
      setMessage(movie.myReview ? 'Рецензію оновлено' : 'Дякуємо за рецензію!')
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate('/login', { state: { from: location.pathname } })
        return
      }
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form-heading">
        <div>
          <span className="eyebrow">Ваша думка</span>
          <h3>{movie.myReview ? 'Оновити рецензію' : 'Написати рецензію'}</h3>
        </div>
        <span className="review-form-user">{user.name}</span>
      </div>

      <div className="score-picker" role="group" aria-label="Оцінка фільму">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
          <button
            type="button"
            key={score}
            className={score === rating ? 'is-active' : ''}
            onClick={() => setRating(score)}
            aria-pressed={score === rating}
          >
            {score}
          </button>
        ))}
      </div>

      <label className="review-text-field">
        <span>Рецензія</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Що вас вразило? Які емоції залишив фільм?"
          rows="5"
          maxLength="1200"
          required
        />
        <small>{text.length}/1200</small>
      </label>

      {error && <p className="form-error">{error}</p>}
      {message && (
        <p className="form-success">
          <CheckIcon size={15} />
          {message}
        </p>
      )}

      <button
        className="button button-primary"
        type="submit"
        disabled={saving}
      >
        {saving
          ? 'Зберігаємо...'
          : movie.myReview
            ? 'Оновити рецензію'
            : 'Опублікувати'}
      </button>
    </form>
  )
}

function Reviews({ movie, onSaved }) {
  const summary = movie.reviewSummary || { average: 0, count: 0 }

  return (
    <section className="reviews-section" id="reviews">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Спільнота</span>
          <h2>Рецензії глядачів</h2>
        </div>
        <span className="review-count">{summary.count} відгуків</span>
      </div>

      <div className="reviews-layout">
        <aside className="review-summary">
          <span className="summary-label">Оцінка глядачів</span>
          <strong>{summary.average ? summary.average.toFixed(1) : '—'}</strong>
          <div className="summary-stars" aria-hidden="true">
            <StarIcon size={18} />
            <StarIcon size={18} />
            <StarIcon size={18} />
            <StarIcon size={18} />
            <StarIcon size={18} />
          </div>
          <p>
            {summary.count
              ? `На основі ${summary.count} ${summary.count === 1 ? 'рецензії' : 'рецензій'}`
              : 'Станьте першим, хто оцінить цей фільм'}
          </p>
        </aside>

        <div className="reviews-main">
          <ReviewForm movie={movie} onSaved={onSaved} />

          <div className="review-list">
            {movie.reviews?.length ? (
              movie.reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-author">
                    <span className="review-avatar">
                      {review.userName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{review.userName}</strong>
                      <span>{formatDate(review.updatedAt)}</span>
                    </div>
                    <span className="review-score">
                      <StarIcon size={14} />
                      {review.rating}
                    </span>
                  </div>
                  <p>{review.text}</p>
                </article>
              ))
            ) : (
              <div className="review-empty">
                <p>Поки що тут тихо. Ваша рецензія може стати першою.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function MoviePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')
  const [shareNote, setShareNote] = useState('')

  // Повідомлення «Посилання скопійовано» закривається само за 30 с або кнопкою
  useEffect(() => {
    if (!shareNote) return undefined
    const timer = setTimeout(() => setShareNote(''), 30000)
    return () => clearTimeout(timer)
  }, [shareNote])
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const { captions } = useA11y()
  const captionParams = captions ? '&cc_load_policy=1&hl=uk&cc_lang_pref=uk' : ''

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setTrailerPlaying(false)

    api
      .movie(id)
      .then((data) => {
        if (active) setMovie(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  function watchTrailer() {
    if (!movie?.trailerKey) return
    setTrailerPlaying(true)
    document
      .getElementById('trailer')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function shareMovie() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: movie.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote('Посилання скопійовано')
    } catch {
      setShareNote('Скопіюйте посилання з адресного рядка')
    }
  }

  async function toggleFavorite() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setFavoriteBusy(true)
    setFavoriteError('')
    const nextValue = !movie.isFavorite
    setMovie((current) => ({ ...current, isFavorite: nextValue }))
    try {
      if (nextValue) await api.addFavorite(movie.id)
      else await api.removeFavorite(movie.id)
    } catch (requestError) {
      setMovie((current) => ({ ...current, isFavorite: !nextValue }))
      setFavoriteError(requestError.message)
    } finally {
      setFavoriteBusy(false)
    }
  }

  function handleReviewSaved(data) {
    setMovie((current) => ({
      ...current,
      reviews: data.reviews,
      reviewSummary: data.reviewSummary,
      myReview: data.review,
    }))
  }

  if (loading) return <PageLoader />

  if (error || !movie) {
    return (
      <div className="error-state">
        <span className="eyebrow">404</span>
        <h1>Фільм не знайдено</h1>
        <p>{error || 'Можливо, ця сторінка вже не існує.'}</p>
        <Link className="button button-primary" to="/">
          Повернутися до каталогу
        </Link>
      </div>
    )
  }

  return (
    <div className="movie-page">
      <section className="movie-hero">
        <img className="movie-hero-backdrop" src={movie.backdropUrl} alt="" />
        <div className="movie-hero-overlay" />
        <div className="movie-hero-inner">
          <Link className="back-link" to="/">
            <ArrowLeftIcon size={17} />
            До каталогу
          </Link>

          <div className="movie-hero-grid">
            <div className="detail-poster">
              <img src={movie.posterUrl} alt={`Постер фільму «${movie.title}»`} />
            </div>

            <div className="detail-copy">
              <span className="eyebrow">
                {statusLabel(movie)}
              </span>
              <h1>{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="original-title">{movie.originalTitle}</p>
              )}
              {movie.tagline && <p className="tagline">«{movie.tagline}»</p>}

              <div className="detail-meta">
                <span className="detail-rating">
                  <StarIcon size={17} />
                  {ratingLabel(movie)}
                </span>
                {movie.year && (
                  <span>
                    <CalendarIcon size={16} />
                    {movie.year}
                  </span>
                )}
                {movie.runtime && (
                  <span>
                    <ClockIcon size={16} />
                    {formatRuntime(movie.runtime)}
                  </span>
                )}
                {movie.voteCount > 0 && (
                  <span>{movie.voteCount.toLocaleString('uk-UA')} оцінок</span>
                )}
              </div>

              <div className="genre-pills">
                {movie.genres?.map((genre) => (
                  <Link to={`/?genre=${genre.id}`} key={genre.id}>
                    {genre.name}
                  </Link>
                ))}
              </div>

              <p className="detail-overview">
                {movie.overview ||
                  (movie.status === 'Released'
                    ? 'Опис цього фільму українською поки відсутній.'
                    : 'Фільм ще не вийшов. Опис зʼявиться ближче до прем’єри.')}
              </p>

              <div className="detail-actions">
                <button
                  type="button"
                  className={`button ${movie.isFavorite ? 'button-saved' : 'button-primary'}`}
                  onClick={toggleFavorite}
                  disabled={favoriteBusy}
                >
                  {movie.isFavorite ? (
                    <HeartIcon size={18} filled />
                  ) : (
                    <HeartIcon size={18} />
                  )}
                  {movie.isFavorite ? 'В обраному' : 'Додати в обране'}
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={watchTrailer}
                  disabled={!movie.trailerKey}
                >
                  <PlayIcon size={17} />
                  Дивитися трейлер
                </button>
                <button type="button" className="button button-ghost" onClick={shareMovie}>
                  Поділитися
                </button>
                {movie.video ? (
                  <Link
                    className="button button-watch"
                    to={`/movie/${movie.id}/watch`}
                  >
                    <PlayIcon size={17} />
                    Дивитися фільм
                    <span className="watch-where">Онлайн</span>
                  </Link>
                ) : movie.watch?.link ? (
                  <a
                    className="button button-watch"
                    href={movie.watch.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PlayIcon size={17} />
                    Дивитися фільм
                    <span className="watch-where">
                      {movie.watch.providers
                        .slice(0, 2)
                        .map((provider) => provider.name)
                        .join(', ')}
                    </span>
                  </a>
                ) : (
                  <Link
                    className="button button-ghost button-locked"
                    to={`/movie/${movie.id}/watch`}
                  >
                    <LockIcon size={17} />
                    Дивитися фільм
                    <span className="soon-badge">Незабаром</span>
                  </Link>
                )}
              </div>
              {favoriteError && <p className="form-error">{favoriteError}</p>}

              <dl className="detail-facts">
                {movie.director && (
                  <div>
                    <dt>Режисер</dt>
                    <dd>{movie.director}</dd>
                  </div>
                )}
                {movie.releaseDate && (
                  <div>
                    <dt>Премʼєра</dt>
                    <dd>{formatDate(movie.releaseDate)}</dd>
                  </div>
                )}
                <div>
                  <dt>Оцінка TMDB</dt>
                  <dd>
                    {hasReliableRating(movie)
                      ? `${movie.rating} / 10`
                      : movie.rating
                        ? 'Замало оцінок'
                        : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="movie-content">
        <section className="trailer-section" id="trailer">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Відео</span>
              <h2>Офіційний трейлер</h2>
            </div>
          </div>

          <div className="trailer-frame">
            {movie.trailerKey && trailerPlaying ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1&rel=0${captionParams}`}
                title={`Трейлер фільму «${movie.title}»`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="trailer-preview"
                onClick={() => movie.trailerKey && setTrailerPlaying(true)}
                aria-label={
                  movie.trailerKey
                    ? 'Відтворити трейлер'
                    : 'Трейлер недоступний'
                }
              >
                <img src={movie.backdropUrl} alt="" />
                <span className="trailer-shade" />
                {movie.trailerKey ? (
                  <>
                    <span className="trailer-play">
                      <PlayIcon size={28} />
                    </span>
                    <span className="trailer-caption">
                      Натисніть, щоб відтворити
                    </span>
                  </>
                ) : (
                  <span className="trailer-caption">
                    Трейлер для цього фільму поки недоступний
                  </span>
                )}
              </button>
            )}
          </div>
        </section>

        {movie.cast?.length > 0 && (
          <section className="cast-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Команда</span>
                <h2>У головних ролях</h2>
              </div>
            </div>
            <div className="cast-grid">
              {movie.cast.map((person) => (
                <div className="cast-card" key={person.id || person.name}>
                  <span className="cast-avatar">
                    {person.profileUrl ? (
                      <img src={person.profileUrl} alt="" loading="lazy" />
                    ) : (
                      person.name.slice(0, 1)
                    )}
                  </span>
                  <strong>{person.name}</strong>
                  {person.character && <span>{person.character}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.similar?.length > 0 && (
          <section className="similar-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Рекомендації</span>
                <h2>Схожі фільми</h2>
              </div>
            </div>
            <div className="movie-grid">
              {movie.similar.map((item) => (
                <MovieCard key={item.id} movie={item} />
              ))}
            </div>
          </section>
        )}

        <Reviews movie={movie} onSaved={handleReviewSaved} />
      </div>

      {shareNote && (
        <div className="toast" role="status">
          <span>{shareNote}</span>
          <button type="button" onClick={() => setShareNote('')} aria-label="Закрити повідомлення">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
