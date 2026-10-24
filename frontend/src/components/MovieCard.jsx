import { Link } from 'react-router-dom'
import { HeartIcon, StarIcon } from './Icons.jsx'

export function MovieCard({ movie, action, showFavorite = false }) {
  const genreLine = movie.genres
    ?.slice(0, 2)
    .map((genre) => genre.name)
    .join(' · ')

  return (
    <article className="movie-card">
      <Link to={`/movie/${movie.id}`} className="movie-card-link">
        <div className="movie-poster">
          <img
            src={movie.posterUrl}
            alt={`Постер фільму «${movie.title}»`}
            loading="lazy"
          />
          <div className="poster-shade" />
          <span className="rating-chip">
            <StarIcon size={14} />
            {movie.rating ? movie.rating.toFixed(1) : '—'}
          </span>
          {showFavorite && (
            <span className="favorite-marker" aria-label="У обраному">
              <HeartIcon size={16} filled />
            </span>
          )}
        </div>
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
