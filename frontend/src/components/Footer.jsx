import { Link } from 'react-router-dom'
import { FilmIcon } from './Icons.jsx'

const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-text">
              CINE<span>SCOPE</span>
            </span>
          </Link>
          <p>
            Місце, де велике кіно починається з одного кадру. Обирайте,
            дивіться, діліться враженнями.
          </p>
        </div>

        <div className="footer-column">
          <h3>Навігація</h3>
          <Link to="/">Каталог</Link>
          <Link to="/favorites">Обране</Link>
          <Link to="/login">Вхід</Link>
        </div>

        <div className="footer-column">
          <h3>Колекції</h3>
          <Link to="/?sort=rating_desc">Найвищий рейтинг</Link>
          <Link to="/?sort=year_desc">Новинки</Link>
          <Link to="/?genre=878">Фантастика</Link>
        </div>

        <div className="footer-note">
          <FilmIcon size={26} />
          <p>
            Дані про фільми надає TMDB. Цей продукт використовує TMDB API,
            але не схвалений і не сертифікований TMDB.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {currentYear} CineScope</span>
        <span>Створено для тих, хто любить кіно</span>
      </div>
    </footer>
  )
}
