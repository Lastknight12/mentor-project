import { Link } from 'react-router-dom'
import { FilmIcon } from '../components/Icons.jsx'

export function NotFoundPage() {
  return (
    <div className="error-state">
      <span className="eyebrow">404</span>
      <span className="empty-icon">
        <FilmIcon size={34} />
      </span>
      <h1>Кадр загубився</h1>
      <p>Такої сторінки немає. Але у каталозі точно знайдеться щось цікаве.</p>
      <Link className="button button-primary" to="/">
        Повернутися до каталогу
      </Link>
    </div>
  )
}
