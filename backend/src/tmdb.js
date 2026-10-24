import { config, hasTmdbCredentials } from './config.js'
import { withCache } from './cache.js'

export class TmdbError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'TmdbError'
    this.status = status
  }
}

const sortMap = {
  popularity_desc: 'popularity.desc',
  rating_desc: 'vote_average.desc',
  rating_asc: 'vote_average.asc',
  year_desc: 'primary_release_date.desc',
  year_asc: 'primary_release_date.asc',
  title_asc: 'original_title.asc',
  title_desc: 'original_title.desc',
}

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}

async function rawRequest(path, params) {
  if (!hasTmdbCredentials) {
    throw new TmdbError('TMDB credentials are not configured', 503)
  }

  const query = new URLSearchParams(
    cleanParams({ language: config.tmdbLanguage, ...params }),
  )

  if (!config.tmdbAccessToken && config.tmdbApiKey) {
    query.set('api_key', config.tmdbApiKey)
  }

  const headers = { accept: 'application/json' }
  if (config.tmdbAccessToken) {
    headers.authorization = `Bearer ${config.tmdbAccessToken}`
  }

  let response
  try {
    response = await fetch(`${config.tmdbBaseUrl}${path}?${query}`, {
      headers,
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    throw new TmdbError('TMDB is temporarily unavailable', 503)
  }

  if (!response.ok) {
    let message = `TMDB request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body.status_message) message = body.status_message
    } catch {
      message = `TMDB request failed with status ${response.status}`
    }
    throw new TmdbError(message, response.status)
  }

  return response.json()
}

async function cachedRequest(path, params, ttlMs = config.cacheTtlMs) {
  const key = `${path}?${new URLSearchParams(cleanParams(params)).toString()}`
  const result = await withCache(key, ttlMs, () => rawRequest(path, params))
  return result.value
}

export function getGenres() {
  return cachedRequest('/genre/movie/list', {}, 24 * 60 * 60 * 1000)
}

export function discoverMovies({ page, genreId, year, minRating, sort }) {
  return cachedRequest('/discover/movie', {
    page,
    sort_by: sortMap[sort] || sortMap.popularity_desc,
    with_genres: genreId || undefined,
    primary_release_year: year || undefined,
    'vote_average.gte': minRating || undefined,
    'vote_count.gte': minRating ? 80 : undefined,
    include_adult: false,
    include_video: false,
  })
}

export function searchMovies({ page, query }) {
  return cachedRequest('/search/movie', {
    page,
    query,
    include_adult: false,
  })
}

export function getMovieDetails(id) {
  return cachedRequest(
    `/movie/${id}`,
    { append_to_response: 'videos,credits' },
    15 * 60 * 1000,
  )
}

export const tmdbSortMap = sortMap
