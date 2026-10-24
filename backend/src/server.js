import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { config, hasTmdbCredentials } from './config.js'
import { mediaRouter } from './media.js'
import { authRouter } from './routes/auth.js'
import { favoritesRouter } from './routes/favorites.js'
import { moviesRouter } from './routes/movies.js'
import { initStore } from './store.js'

await initStore()

const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: config.corsOrigin,
  }),
)
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    source: hasTmdbCredentials ? 'tmdb' : 'demo',
  })
})

app.use('/api/media', mediaRouter)
app.use('/api/auth', authRouter)
app.use('/api/movies', moviesRouter)
app.use('/api/favorites', favoritesRouter)

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API маршрут не знайдено' })
})

const indexFile = path.join(config.frontendDist, 'index.html')
if (existsSync(indexFile)) {
  app.use(express.static(config.frontendDist))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(indexFile)
  })
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  console.error(error)
  res.status(500).json({ error: 'Внутрішня помилка сервера' })
})

app.listen(config.port, () => {
  const mode = hasTmdbCredentials ? 'TMDB' : 'demo catalog'
  console.log(`CineScope API running on http://localhost:${config.port} (${mode})`)
})
