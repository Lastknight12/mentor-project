import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { LogoutIcon, SearchIcon, StarIcon } from './Icons.jsx'

export function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')

  useEffect(() => {
    if (location.pathname === '/') {
      setTerm(new URLSearchParams(location.search).get('q') || '')
    }
  }, [location.pathname, location.search])

  function handleSearch(event) {
    event.preventDefault()
    const query = term.trim()
    navigate(query ? `/?q=${encodeURIComponent(query)}` : '/')
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="CineScope — на головну">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-text">
            CINE<span>SCOPE</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Головна навігація">
          <NavLink to="/" end>
            Каталог
          </NavLink>
          <NavLink to="/favorites">Обране</NavLink>
        </nav>

        <form className="header-search" onSubmit={handleSearch} role="search">
          <SearchIcon size={18} />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Пошук фільму..."
            aria-label="Пошук фільму"
          />
          <button type="submit" aria-label="Знайти">
            <SearchIcon size={17} />
          </button>
        </form>

        <div className="header-actions">
          {user ? (
            <>
              <Link className="user-chip" to="/favorites">
                <span className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
              </Link>
              <button
                className="icon-button"
                type="button"
                onClick={logout}
                aria-label="Вийти з акаунта"
                title="Вийти"
              >
                <LogoutIcon />
              </button>
            </>
          ) : (
            <>
              <Link className="text-link" to="/login">
                Увійти
              </Link>
              <Link className="button button-small" to="/register">
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mobile-search">
        <form onSubmit={handleSearch} role="search">
          <SearchIcon size={18} />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Пошук фільму..."
            aria-label="Пошук фільму"
          />
        </form>
        <Link className="mobile-rating-link" to="/?sort=rating_desc">
          <StarIcon size={15} />
          Топ
        </Link>
      </div>
    </header>
  )
}
