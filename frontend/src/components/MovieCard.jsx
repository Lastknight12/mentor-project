import { Link } from 'react-router-dom'
import { HeartIcon, PlayIcon, StarIcon } from './Icons.jsx'
import { ratingLabel } from '../rating.js'

export function MovieCard({ movie, action, showFavorite = false }) {
  const genreLine = movie.genres
    ?.slice(0, 2)
    .map((genre) => genre.name)
    .join(' · ')

  return (
    <article className="movie-card">
      <div className="movie-poster-wrap">
      <Link
        to={`/movie/${movie.id}`}
        className="movie-card-link"
        aria-label={`Сторінка фільму «${movie.title}»`}
      >
        <div className="movie-poster">
          <img
            src={movie.posterUrl}
            alt={`Постер фільму «${movie.title}»`}
            loading="lazy"
          />
          <div className="poster-shade" />
          <span className="poster-play" aria-hidden="true">
            <PlayIcon size={22} />
          </span>
          <span className="rating-chip">
            <StarIcon size={14} />
            {ratingLabel(movie)}
          </span>
          {movie.restricted && <span className="age-chip">18+</span>}
          {movie.hasVideo && (
            <span className="online-chip">
              <PlayIcon size={10} />
              Онлайн
            </span>
          )}
          {showFavorite && (
            <span className="favorite-marker" aria-label="У обраному">
              <HeartIcon size={16} filled />
            </span>
          )}
        </div>
      </Link>
      <Link
        to={`/movie/${movie.id}/watch`}
        className="poster-watch"
        aria-label={`Дивитися фільм «${movie.title}»`}
      >
        <PlayIcon size={14} />
        Дивитися
      </Link>
      </div>
      <Link to={`/movie/${movie.id}`} className="movie-card-link" tabIndex={-1}>
        <div className="movie-card-info">
          <h3>{movie.title}</h3>
          <div className="movie-card-meta">
            <span>{movie.year || '—'}</span>
            {genreLine && <span>{genreLine}</span>}
          </div>
        </div>
      </Link>
      {action && <div className="movie-card-action">{action}</div>}
    </article>
  )
}
