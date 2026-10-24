export function MovieSkeleton() {
  return (
    <div className="movie-skeleton" aria-hidden="true">
      <div className="skeleton-poster shimmer" />
      <div className="skeleton-line shimmer" />
      <div className="skeleton-line short shimmer" />
    </div>
  )
}

export function LoadingGrid({ count = 12 }) {
  return (
    <div className="movie-grid">
      {Array.from({ length: count }, (_, index) => (
        <MovieSkeleton key={index} />
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <span className="loader-ring" />
      <span>Завантажуємо кіно...</span>
    </div>
  )
}
