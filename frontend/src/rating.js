// Оцінка вважається надійною, коли набралося достатньо голосів.
// Для свіжих фільмів із кількома голосами TMDB дає випадкові «10.0» —
// такі оцінки ми не показуємо як справжні.
export const MIN_VOTES = 30

export function hasReliableRating(movie) {
  return Boolean(movie?.rating) && (movie.voteCount || 0) >= MIN_VOTES
}

// Текст для значка: «7.9», «Нова» (мало голосів) або «—» (оцінки ще немає)
export function ratingLabel(movie) {
  if (hasReliableRating(movie)) return movie.rating.toFixed(1)
  return movie?.rating ? 'Нова' : '—'
}
