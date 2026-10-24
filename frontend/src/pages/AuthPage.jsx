import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { ArrowUpRightIcon, FilmIcon, StarIcon } from '../components/Icons.jsx'
import { PageLoader } from '../components/Loaders.jsx'

export function AuthPage({ mode }) {
  const { user, loading, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'
  const from = location.state?.from || '/'

  if (loading) return <PageLoader />
  if (user) return <Navigate to={from} replace />

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        })
      }
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-text">
            CINE<span>SCOPE</span>
          </span>
        </Link>
        <div className="auth-visual-content">
          <span className="eyebrow">
            <FilmIcon size={16} />
            Кіно, яке залишається
          </span>
          <h1>Ваша особиста кіноколекція</h1>
          <p>
            Зберігайте улюблені стрічки, відкривайте нові історії та
            обмінюйтеся думками з іншими глядачами.
          </p>
          <div className="auth-stats">
            <div>
              <strong>48+</strong>
              <span>фільмів у каталозі</span>
            </div>
            <div>
              <strong>10</strong>
              <span>бальна система оцінок</span>
            </div>
            <div>
              <StarIcon size={20} />
              <span>живі рецензії</span>
            </div>
          </div>
        </div>
        <div className="auth-poster-stack" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <span className="eyebrow">{isRegister ? 'Новий глядач' : 'З поверненням'}</span>
          <h2>{isRegister ? 'Створити акаунт' : 'Увійти в CineScope'}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Кілька секунд — і ваша кіноколекція почнеться.'
              : 'Продовжте з того місця, де зупинилися.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                <span>Імʼя</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Як вас називати?"
                  autoComplete="name"
                  minLength="2"
                  required
                />
              </label>
            )}
            <label>
              <span>Електронна пошта</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span>Пароль</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={updateField}
                placeholder="Щонайменше 6 символів"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength="6"
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="button button-primary button-wide"
              disabled={submitting}
            >
              {submitting
                ? 'Зачекайте...'
                : isRegister
                  ? 'Зареєструватися'
                  : 'Увійти'}
              {!submitting && <ArrowUpRightIcon size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Вже маєте акаунт?' : 'Ще не з нами?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Увійти' : 'Створити акаунт'}
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
