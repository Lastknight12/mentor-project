import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { HeartIcon, UserIcon } from '../components/Icons.jsx'
import { LoadingGrid, PageLoader } from '../components/Loaders.jsx'
import { MovieCard } from '../components/MovieCard.jsx'

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError('')
    api
      .favorites()
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
  }, [user])

  async function removeMovie(movieId) {
    setRemovingId(movieId)
    setError('')
    try {
      await api.removeFavorite(movieId)
      setItems((current) => current.filter((movie) => movie.id !== movieId))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRemovingId(null)
    }
  }

  if (authLoading) return <PageLoader />

  if (!user) {
    return (
      <div className="empty-state favorites-guest">
        <span className="empty-icon">
          <UserIcon size={32} />
        </span>
        <h1>Обране чекає на вас</h1>
        <p>
          Увійдіть в акаунт, щоб зберігати фільми та повертатися до них у
          будь-який момент.
        </p>
        <div className="empty-actions">
          <Link
            className="button button-primary"
            to="/login"
            state={{ from: location.pathname }}
          >
            Увійти
          </Link>
          <Link className="button button-ghost" to="/register">
            Створити акаунт
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-page page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <HeartIcon size={16} filled />
            Ваша колекція
          </span>
          <h1>Обране</h1>
          <p>Фільми, до яких ви хочете повернутися.</p>
        </div>
        {!loading && items.length > 0 && (
          <span className="collection-count">{items.length} фільмів</span>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <strong>Не вдалося виконати дію.</strong>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingGrid count={8} />
      ) : items.length ? (
        <div className="movie-grid">
          {items.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              showFavorite
              action={
                <button
                  type="button"
                  className="remove-favorite"
                  onClick={() => removeMovie(movie.id)}
                  disabled={removingId === movie.id}
                >
                  <HeartIcon size={15} filled />
                  {removingId === movie.id ? 'Прибираємо...' : 'Прибрати'}
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <HeartIcon size={32} />
          </span>
          <h2>У колекції ще немає фільмів</h2>
          <p>
            Натискайте «Додати в обране» на сторінці фільму, і він зʼявиться
            тут.
          </p>
          <Link className="button button-primary" to="/">
            Перейти до каталогу
          </Link>
        </div>
      )}
    </div>
  )
}
