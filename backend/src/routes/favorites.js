import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { moviesByIds } from '../catalogue.js'
import {
  addFavorite,
  getFavoriteIds,
  removeFavorite,
} from '../store.js'

function parseMovieId(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export const favoritesRouter = Router()

favoritesRouter.use(requireAuth)

favoritesRouter.get('/', async (req, res) => {
  const ids = getFavoriteIds(req.user.id)
  const items = await moviesByIds(ids)
  res.json({
    items: items.map((movie) => ({ ...movie, isFavorite: true })),
    ids,
  })
})

favoritesRouter.post('/:movieId', async (req, res) => {
  const id = parseMovieId(req.params.movieId)
  if (!id) return res.status(400).json({ error: 'Некоректний ідентифікатор фільму' })
  await addFavorite(req.user.id, id)
  res.status(201).json({ isFavorite: true, movieId: id })
})

favoritesRouter.delete('/:movieId', async (req, res) => {
  const id = parseMovieId(req.params.movieId)
  if (!id) return res.status(400).json({ error: 'Некоректний ідентифікатор фільму' })
  await removeFavorite(req.user.id, id)
  res.json({ isFavorite: false, movieId: id })
})
