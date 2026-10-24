import { hasTmdbCredentials } from './config.js'
import {
  demoGenres,
  getDemoMovie,
  queryDemoMovies,
} from './demo.js'
import {
  discoverMovies,
  getGenres as getTmdbGenres,
  getMovieDetails as getTmdbMovieDetails,
  searchMovies,
} from './tmdb.js'

function imageUrl(path, size) {
  return path ? `/api/media/tmdb/${size}${path}` : null
}

function placeholder(kind, id, title) {
  return `/api/media/${kind}/${id}?title=${encodeURIComponent(title || '')}`
}

function genreItem(genre) {
  return { id: genre.id, name: genre.name }
}

function makeGenreMap(genres) {
  return new Map(genres.map((genre) => [genre.id, genre]))
}

function resolveGenres(raw, genreMap) {
  if (Array.isArray(raw.genres) && raw.genres.length) {
    return raw.genres.map(genreItem)
  }
  return (raw.genre_ids || [])
    .map((id) => genreMap.get(id))
    .filter(Boolean)
    .map(genreItem)
}

function resolveTrailer(raw) {
  const videos = raw.videos?.results || []
  const trailer =
    videos.find(
      (video) =>
        video.site === 'YouTube' &&
        video.type === 'Trailer' &&
        video.official,
    ) ||
    videos.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer',
    ) ||
    videos.find((video) => video.site === 'YouTube')
  return trailer?.key || null
}

function resolveCredits(raw) {
  if (!raw.credits) return { director: null, cast: [] }
  const director = raw.credits.crew?.find(
    (person) => person.job === 'Director',
  )
  return {
    director: director?.name || null,
    cast: (raw.credits.cast || []).slice(0, 6).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || '',
      profileUrl: imageUrl(person.profile_path, 'w185'),
    })),
  }
}

function normalizeMovie(raw, genreMap) {
  const title = raw.title || raw.name || 'Без назви'
  const releaseDate = raw.release_date || ''
  const credits = resolveCredits(raw)
  return {
    id: raw.id,
    title,
    originalTitle: raw.original_title || title,
    overview: raw.overview || '',
    releaseDate,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    rating: Math.round((raw.vote_average || 0) * 10) / 10,
    voteCount: raw.vote_count || 0,
    runtime: raw.runtime || null,
    tagline: raw.tagline || '',
    status: raw.status || '',
    language: raw.original_language || '',
    popularity: raw.popularity || 0,
    genres: resolveGenres(raw, genreMap),
    posterUrl:
      imageUrl(raw.poster_path, 'w500') ||
      placeholder('poster', raw.id, title),
    backdropUrl:
      imageUrl(raw.backdrop_path, 'w1280') ||
      placeholder('backdrop', raw.id, title),
    trailerKey: resolveTrailer(raw),
    director: credits.director,
    cast: credits.cast,
  }
}

function sortResults(results, sort) {
  const sorted = [...results]
  if (sort === 'rating_desc') {
    return sorted.sort((a, b) => b.rating - a.rating)
  }
  if (sort === 'rating_asc') {
    return sorted.sort((a, b) => a.rating - b.rating)
  }
  if (sort === 'year_desc') {
    return sorted.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  }
  if (sort === 'year_asc') {
    return sorted.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
  }
  if (sort === 'title_asc') {
    return sorted.sort((a, b) => a.title.localeCompare(b.title, 'uk'))
  }
  if (sort === 'title_desc') {
    return sorted.sort((a, b) => b.title.localeCompare(a.title, 'uk'))
  }
  return sorted.sort((a, b) => b.popularity - a.popularity)
}

function filterSearchResults(results, { genreId, year, minRating }) {
  return results.filter((movie) => {
    if (genreId && !movie.genres.some((genre) => genre.id === Number(genreId))) {
      return false
    }
    if (year && movie.year !== Number(year)) return false
    if (minRating && movie.rating < Number(minRating)) return false
    return true
  })
}

async function loadGenres() {
  if (!hasTmdbCredentials) return { genres: demoGenres, source: 'demo' }
  try {
    const payload = await getTmdbGenres()
    return { genres: payload.genres || [], source: 'tmdb' }
  } catch {
    return { genres: demoGenres, source: 'demo' }
  }
}

export async function listGenres() {
  const result = await loadGenres()
  return result.genres
}

export async function browseMovies(options) {
  const { genres } = await loadGenres()
  const genreMap = makeGenreMap(genres)
  const query = String(options.query || '').trim()

  if (!hasTmdbCredentials) {
    const demo = queryDemoMovies(options)
    return { ...demo, genres, source: 'demo' }
  }

  try {
    const payload = query
      ? await searchMovies({ page: options.page, query })
      : await discoverMovies({
          page: options.page,
          genreId: options.genreId,
          year: options.year,
          minRating: options.minRating,
          sort: options.sort,
        })

    let results = (payload.results || []).map((movie) =>
      normalizeMovie(movie, genreMap),
    )

    if (query) {
      results = filterSearchResults(results, options)
      results = sortResults(results, options.sort)
    }

    return {
      page: payload.page || options.page || 1,
      totalPages: Math.min(payload.total_pages || 1, 500),
      totalResults: payload.total_results || 0,
      results,
      genres,
      source: 'tmdb',
    }
  } catch {
    const demo = queryDemoMovies(options)
    return { ...demo, genres, source: 'demo' }
  }
}

export async function movieDetails(id) {
  const { genres } = await loadGenres()
  const genreMap = makeGenreMap(genres)

  if (hasTmdbCredentials) {
    try {
      const raw = await getTmdbMovieDetails(id)
      return { movie: normalizeMovie(raw, genreMap), source: 'tmdb' }
    } catch (error) {
      if (error.status === 404) return { movie: null, source: 'tmdb' }
    }
  }

  const demo = getDemoMovie(id)
  if (!demo) return { movie: null, source: 'demo' }
  return { movie: normalizeMovie(demo, genreMap), source: 'demo' }
}

export async function moviesByIds(ids) {
  const settled = await Promise.allSettled(ids.map((id) => movieDetails(id)))
  return settled
    .filter((item) => item.status === 'fulfilled' && item.value.movie)
    .map((item) => item.value.movie)
}
