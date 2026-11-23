import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { PlayIcon } from '../components/Icons.jsx'
import { LoadingGrid } from '../components/Loaders.jsx'
import { MovieCard } from '../components/MovieCard.jsx'

export function OnlinePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .online()
      .then((data) => {
        if (active) setItems(data.items || [])
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
  }, [])

  return (
    <div className="online-page page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <PlayIcon size={14} />
            Безкоштовно
          </span>
          <h1>Дивитися на сайті</h1>
          <p>
            Фільми з вільною ліцензією (public domain або Creative Commons):
            їх можна дивитися прямо тут, у вбудованому плеєрі.
          </p>
        </div>
        {!loading && items.length > 0 && (
          <span className="collection-count">{items.length} фільмів</span>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <strong>Не вдалося завантажити список.</strong>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingGrid count={4} />
      ) : items.length ? (
        <div className="movie-grid">
          {items.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <h2>Поки що немає фільмів з плеєром</h2>
            <p>Скоро тут зʼявляться безкоштовні фільми.</p>
            <Link className="button button-primary" to="/">
              Перейти до каталогу
            </Link>
          </div>
        )
      )}
    </div>
  )
}
