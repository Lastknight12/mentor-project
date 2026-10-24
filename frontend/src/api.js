const tokenKey = 'cinescope_token'

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function setToken(token) {
  if (token) localStorage.setItem(tokenKey, token)
  else localStorage.removeItem(tokenKey)
}

function queryString(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return query.toString()
}

async function request(path, options = {}) {
  const { method = 'GET', body, params } = options
  const token = getToken()
  const headers = { accept: 'application/json' }
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token}`

  const suffix = params ? `?${queryString(params)}` : ''
  let response
  try {
    response = await fetch(`/api${path}${suffix}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Не вдалося зʼєднатися із сервером')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error || 'Щось пішло не так')
    error.status = response.status
    throw error
  }
  return data
}

export const api = {
  health: () => request('/health'),
  genres: () => request('/movies/genres'),
  movies: (params) => request('/movies', { params }),
  search: (params) => request('/movies/search', { params }),
  movie: (id) => request(`/movies/${id}`),
  reviews: (id) => request(`/movies/${id}/reviews`),
  addReview: (id, body) =>
    request(`/movies/${id}/reviews`, { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  me: () => request('/auth/me'),
  favorites: () => request('/favorites'),
  addFavorite: (id) => request(`/favorites/${id}`, { method: 'POST' }),
  removeFavorite: (id) => request(`/favorites/${id}`, { method: 'DELETE' }),
}
