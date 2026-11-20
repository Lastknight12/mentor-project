import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { ArrowLeftIcon, LockIcon, PlayIcon, UnlockIcon } from '../components/Icons.jsx'
import { PageLoader } from '../components/Loaders.jsx'
import { VideoPlayer } from '../components/VideoPlayer.jsx'

const TYPE_LABELS = {
  subscription: 'За підпискою',
  free: 'Безкоштовно',
  rent: 'Оренда',
  buy: 'Купівля',
}

function WatchProviders({ watch }) {
  if (!watch?.providers?.length) {
    return (
      <section className="providers">
        <h2>Де дивитися</h2>
        <p className="providers-empty">
          Для вашого регіону легальних джерел перегляду поки не знайдено.
        </p>
      </section>
    )
  }
  return (
    <section className="providers">
      <h2>Де дивитися легально</h2>
      <div className="providers-list">
        {watch.providers.map((provider) => (
          <a
            key={provider.id}
            className="provider"
            href={watch.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {provider.logoUrl && <img src={provider.logoUrl} alt="" />}
            <span>
              <strong>{provider.name}</strong>
              <small>{TYPE_LABELS[provider.type]}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="providers-credit">Дані про сервіси: JustWatch через TMDB.</p>
    </section>
  )
}

export function WatchPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const [tab, setTab] = useState('film')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setTrailerPlaying(false)
    setTab('film')
    api
      .movie(id)
      .then((data) => active && setMovie(data))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <PageLoader />

  const hasProviders = Boolean(movie?.watch?.providers?.length)
  const hasVideo = Boolean(movie?.video?.sources?.length)
  const showPlayer = hasVideo && tab === 'film'

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
    <div className="watch-page">
      <Link className="back-link" to={`/movie/${movie.id}`}>
        <ArrowLeftIcon size={17} />
        До сторінки фільму
      </Link>

      <h1 className="watch-title">
        {movie.title} {movie.year && <span>({movie.year})</span>}
      </h1>

      {hasVideo && (
        <div className="watch-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'film'}
            className={tab === 'film' ? 'is-active' : ''}
            onClick={() => setTab('film')}
          >
            <PlayIcon size={15} />
            Дивитися онлайн
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'trailer'}
            className={tab === 'trailer' ? 'is-active' : ''}
            onClick={() => {
              setTab('trailer')
              setTrailerPlaying(Boolean(movie.trailerKey))
            }}
          >
            Трейлер
          </button>
        </div>
      )}

      <div className="trailer-frame watch-player">
        {showPlayer ? (
          <VideoPlayer
            key={movie.id}
            sources={movie.video.sources}
            poster={movie.backdropUrl}
            title={movie.title}
          />
        ) : trailerPlaying && movie.trailerKey ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1&rel=0`}
            title={`Трейлер фільму «${movie.title}»`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img src={movie.backdropUrl} alt="" />
            <span className="trailer-shade" />
            <div className="watch-lock">
              <span
                className={`round-icon ${hasProviders ? 'is-unlocked' : ''}`}
              >
                {hasProviders ? <UnlockIcon size={26} /> : <LockIcon size={26} />}
              </span>
              {hasProviders ? (
                <>
                  <h2>Дивіться фільм на офіційних сервісах</h2>
                  <p>
                    Фільм доступний легально — оберіть сервіс нижче. Тут можна
                    переглянути трейлер.
                  </p>
                </>
              ) : (
                <>
                  <h2>Фільм поки недоступний для перегляду</h2>
                  <p>
                    Повна версія зʼявиться незабаром. А поки що можна
                    переглянути трейлер.
                  </p>
                </>
              )}
              <button
                type="button"
                className="button button-primary"
                onClick={() => setTrailerPlaying(true)}
                disabled={!movie.trailerKey}
              >
                <PlayIcon size={17} />
                {movie.trailerKey ? 'Дивитися трейлер' : 'Трейлер недоступний'}
              </button>
            </div>
          </>
        )}
      </div>

      {showPlayer && movie.video.license && (
        <p className="watch-license">{movie.video.license}</p>
      )}

      <WatchProviders watch={movie.watch} />

      <p className="watch-overview">{movie.overview}</p>
    </div>
  )
}
