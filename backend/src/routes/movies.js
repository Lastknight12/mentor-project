import { Router } from 'express'
import { optionalAuth, requireAuth } from '../auth.js'
import { browseMovies, listGenres, movieDetails } from '../catalogue.js'
import {
  getReviewSummary,
  isFavorite,
  listReviews,
  upsertReview,
} from '../store.js'

function pageNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function movieId(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function readFilters(req) {
  return {
    page: pageNumber(req.query.page),
    genreId: req.query.genre ? Number(req.query.genre) : null,
    year: req.query.year ? Number(req.query.year) : null,
    minRating: req.query.minRating ? Number(req.query.minRating) : null,
    sort: String(req.query.sort || 'popularity_desc'),
    query: String(req.query.query || '').trim(),
  }
}

export const moviesRouter = Router()

moviesRouter.get('/genres', async (req, res) => {
  const genres = await listGenres()
  res.json({ genres })
})

moviesRouter.get('/search', async (req, res) => {
  const filters = readFilters(req)
  if (!filters.query) {
    return res.status(400).json({ error: 'Введіть назву фільму для пошуку' })
  }
  const result = await browseMovies(filters)
  res.json(result)
})

moviesRouter.get('/', async (req, res) => {
  const result = await browseMovies(readFilters(req))
  res.json(result)
})

moviesRouter.get('/:id/reviews', async (req, res) => {
  const id = movieId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Некоректний ідентифікатор фільму' })
  res.json({
    reviews: listReviews(id),
    reviewSummary: getReviewSummary(id),
  })
})

moviesRouter.post('/:id/reviews', requireAuth, async (req, res) => {
  const id = movieId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Некоректний ідентифікатор фільму' })

  const rating = Number(req.body?.rating)
  const text = String(req.body?.text || '').trim()

  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return res.status(400).json({ error: 'Оцінка має бути від 1 до 10' })
  }
  if (text.length < 3) {
    return res.status(400).json({ error: 'Напишіть хоча б кілька слів про фільм' })
  }
  if (text.length > 1200) {
    return res.status(400).json({ error: 'Рецензія не може бути довшою за 1200 символів' })
  }

  const review = await upsertReview({
    userId: req.user.id,
    movieId: id,
    rating: Math.round(rating),
    text,
  })

  res.status(201).json({
    review,
    reviews: listReviews(id),
    reviewSummary: getReviewSummary(id),
  })
})

moviesRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = movieId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Некоректний ідентифікатор фільму' })

  const result = await movieDetails(id)
  if (!result.movie) {
    return res.status(404).json({ error: 'Фільм не знайдено' })
  }

  const reviews = listReviews(id)
  const myReview = req.user
    ? reviews.find((review) => review.userId === req.user.id) || null
    : null

  res.json({
    ...result.movie,
    source: result.source,
    reviews,
    reviewSummary: getReviewSummary(id),
    isFavorite: req.user ? isFavorite(req.user.id, id) : false,
    myReview,
  })
})
