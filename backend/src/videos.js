import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const videosFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../videos.json',
)

// Повертає відео для фільму, якщо воно є в backend/videos.json
export async function getVideo(movieId) {
  try {
    const data = JSON.parse(await readFile(videosFile, 'utf8'))
    const item = data[String(movieId)]
    if (!item || !Array.isArray(item.sources)) return null

    const sources = item.sources
      .filter((source) => source && /^https?:\/\//i.test(source.url || ''))
      .map((source, index) => ({
        label: String(source.label || `Джерело ${index + 1}`),
        url: source.url,
      }))
    if (!sources.length) return null

    const subtitles = (Array.isArray(item.subtitles) ? item.subtitles : [])
      .filter((track) => track && /^(https?:\/\/|\/)/i.test(track.url || ''))
      .map((track) => ({
        label: String(track.label || 'Українська'),
        lang: String(track.lang || 'uk'),
        url: track.url,
      }))

    return { sources, subtitles, license: String(item.license || '') }
  } catch {
    return null
  }
}
