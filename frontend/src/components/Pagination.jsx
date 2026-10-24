import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx'

function pageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page))
  if (current >= total - 2) {
    [total - 3, total - 2, total - 1].forEach((page) => pages.add(page))
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total)
  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('ellipsis')
    result.push(page)
  })
  return result
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Пагінація">
      <button
        type="button"
        className="page-arrow"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Попередня сторінка"
      >
        <ChevronLeftIcon />
      </button>
      <div className="page-numbers">
        {pageList(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span className="page-ellipsis" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <button
              type="button"
              key={item}
              className={item === page ? 'is-active' : ''}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="page-arrow"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Наступна сторінка"
      >
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
