import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from './config.js'

const emptyState = {
  users: [],
  favorites: [],
  reviews: [],
}

let state = structuredClone(emptyState)
let writeQueue = Promise.resolve()

function normalizeState(value) {
  return {
    users: Array.isArray(value?.users) ? value.users : [],
    favorites: Array.isArray(value?.favorites) ? value.favorites : [],
    reviews: Array.isArray(value?.reviews) ? value.reviews : [],
  }
}

async function persist() {
  const snapshot = JSON.stringify(state, null, 2)
  writeQueue = writeQueue.then(() =>
    writeFile(config.dataFile, snapshot, 'utf8'),
  )
  return writeQueue
}

export async function initStore() {
  await mkdir(path.dirname(config.dataFile), { recursive: true })
  try {
    const raw = await readFile(config.dataFile, 'utf8')
    state = normalizeState(JSON.parse(raw))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    state = structuredClone(emptyState)
    await persist()
  }
}

export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

export function findUserByEmail(email) {
  return state.users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  )
}

export function findUserById(id) {
  return state.users.find((user) => user.id === id)
}

export async function createUser({ name, email, passwordHash }) {
  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  state.users.push(user)
  await persist()
  return user
}

export function getFavoriteIds(userId) {
  return state.favorites
    .filter((item) => item.userId === userId)
    .map((item) => item.movieId)
}

export function isFavorite(userId, movieId) {
  return state.favorites.some(
    (item) => item.userId === userId && item.movieId === Number(movieId),
  )
}

export async function addFavorite(userId, movieId) {
  const normalizedId = Number(movieId)
  const exists = state.favorites.some(
    (item) => item.userId === userId && item.movieId === normalizedId,
  )
  if (!exists) {
    state.favorites.push({
      userId,
      movieId: normalizedId,
      createdAt: new Date().toISOString(),
    })
    await persist()
  }
  return true
}

export async function removeFavorite(userId, movieId) {
  const normalizedId = Number(movieId)
  const next = state.favorites.filter(
    (item) => !(item.userId === userId && item.movieId === normalizedId),
  )
  if (next.length !== state.favorites.length) {
    state.favorites = next
    await persist()
  }
  return false
}

function mapReview(review) {
  const user = findUserById(review.userId)
  return {
    id: review.id,
    userId: review.userId,
    userName: user?.name || 'Кіноглядач',
    movieId: review.movieId,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

export function listReviews(movieId) {
  return state.reviews
    .filter((review) => review.movieId === Number(movieId))
    .map(mapReview)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getReviewSummary(movieId) {
  const reviews = state.reviews.filter(
    (review) => review.movieId === Number(movieId),
  )
  if (!reviews.length) return { average: 0, count: 0 }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}

export async function upsertReview({ userId, movieId, rating, text }) {
  const normalizedId = Number(movieId)
  const now = new Date().toISOString()
  const existing = state.reviews.find(
    (review) => review.userId === userId && review.movieId === normalizedId,
  )

  if (existing) {
    existing.rating = rating
    existing.text = text
    existing.updatedAt = now
    await persist()
    return mapReview(existing)
  }

  const review = {
    id: randomUUID(),
    userId,
    movieId: normalizedId,
    rating,
    text,
    createdAt: now,
    updatedAt: now,
  }
  state.reviews.push(review)
  await persist()
  return mapReview(review)
}
