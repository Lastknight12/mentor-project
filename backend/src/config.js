import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(currentDir, '../.env'), quiet: true })

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'cinescope-local-development-secret',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbAccessToken: process.env.TMDB_ACCESS_TOKEN || '',
  tmdbBaseUrl: 'https://api.themoviedb.org/3',
  tmdbLanguage: 'uk-UA',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
  cacheTtlMs: (Number(process.env.CACHE_TTL_SECONDS) || 600) * 1000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dataFile: path.resolve(currentDir, '../data/store.json'),
  imageCacheDir: path.resolve(currentDir, '../data/images'),
  frontendDist: path.resolve(currentDir, '../../frontend/dist'),
}

export const hasTmdbCredentials = Boolean(config.tmdbAccessToken || config.tmdbApiKey)
