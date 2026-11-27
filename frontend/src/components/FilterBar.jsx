import { useState } from 'react'
import { COUNTRY_OPTIONS, countryName } from '../countries.js'
import { CloseIcon, SlidersIcon } from './Icons.jsx'

const years = Array.from(
  { length: new Date().getFullYear() - 1959 },
  (_, index) => new Date().getFullYear() - index,
)

export function FilterBar({ filters, genres, onChange, onReset, shown }) {
  // Рідкісні фільтри сховані під кнопкою; якщо один із них заданий — показуємо
  const hasExtra = Boolean(filters.year || filters.minRating || filters.country)
  const [moreOpen, setMoreOpen] = useState(hasExtra)
  const extraVisible = moreOpen
  const hasFilters =
    filters.country ||
    filters.query ||
    filters.genreId ||
    filters.year ||
    filters.minRating ||
    filters.sort !== 'popularity_desc'

  return (
    <section className="filter-panel" aria-label="Фільтри каталогу">
      <div className="filter-heading">
        <div>
          <span className="eyebrow">
            <SlidersIcon size={15} />
            Фільтри
          </span>
          <p>
            {shown !== null ? `${shown} фільмів у добірці` : 'Шукайте своє кіно'}
          </p>
        </div>
        {hasFilters && (
          <button type="button" className="clear-filters" onClick={onReset}>
            <CloseIcon size={15} />
            Очистити
          </button>
        )}
      </div>

      <div className="filter-grid">
        <label className="filter-field">
          <span>Жанр</span>
          <select
            value={filters.genreId || ''}
            onChange={(event) => onChange({ genreId: event.target.value })}
          >
            <option value="">Усі жанри</option>
            {genres.map((genre) => (
              <option value={genre.id} key={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Сортування</span>
          <select
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
          >
            <option value="popularity_desc">За популярністю</option>
            <option value="rating_desc">Рейтинг: спочатку вищі</option>
            <option value="rating_asc">Рейтинг: спочатку нижчі</option>
            <option value="year_desc">Рік: спочатку нові</option>
            <option value="year_asc">Рік: спочатку старі</option>
            <option value="title_asc">Назва: А–Я</option>
            <option value="title_desc">Назва: Я–А</option>
          </select>
        </label>
        <div className="filter-more">
          <button
            type="button"
            className="more-filters"
            aria-expanded={extraVisible}
            onClick={() => setMoreOpen((value) => !value)}
          >
            <SlidersIcon size={15} />
            {extraVisible ? 'Менше фільтрів' : 'Ще фільтри'}
          </button>
        </div>
        {extraVisible && (
          <>
        <label className="filter-field">
          <span>Рік</span>
          <select
            value={filters.year || ''}
            onChange={(event) => onChange({ year: event.target.value })}
          >
            <option value="">Будь-який рік</option>
            {years.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Рейтинг</span>
          <select
            value={filters.minRating || ''}
            onChange={(event) => onChange({ minRating: event.target.value })}
          >
            <option value="">Будь-який</option>
            <option value="9">9+</option>
            <option value="8">8+</option>
            <option value="7">7+</option>
            <option value="6">6+</option>
          </select>
        </label>

        <label className="filter-field">
          <span>Країна</span>
          <select
            value={filters.country || ''}
            onChange={(event) => onChange({ country: event.target.value })}
          >
            <option value="">Будь-яка країна</option>
            {COUNTRY_OPTIONS.map((code) => (
              <option value={code} key={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </label>
          </>
        )}
      </div>
    </section>
  )
}
