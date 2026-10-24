import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import { config } from './config.js'

const palettes = [
  ['#f6b04d', '#d94a3d', '#1b0f13'],
  ['#79d0c8', '#2c6b8f', '#08131c'],
  ['#e6a1c7', '#7a3f94', '#160b1c'],
  ['#a8d672', '#3f7c52', '#0b170f'],
  ['#f28b66', '#77329a', '#160c1b'],
  ['#9db7ff', '#344f9e', '#0a1022'],
]

const allowedSizes = new Set(['w185', 'w342', 'w500', 'w780', 'w1280', 'original'])
const fileNamePattern = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/

function hashText(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrapTitle(title, maxLength = 15) {
  const words = String(title || 'Фільм').split(/\s+/)
  const lines = []
  let current = ''
  words.forEach((word) => {
    if (!current) {
      current = word
      return
    }
    if (`${current} ${word}`.length <= maxLength) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
  })
  if (current) lines.push(current)
  return lines.slice(0, 4)
}

function renderPoster(id, title) {
  const seed = hashText(`${id}-${title}`)
  const [accent, accentTwo, deep] = palettes[seed % palettes.length]
  const titleLines = wrapTitle(title)
    .map(
      (line, index) =>
        `<text x="46" y="${548 + index * 44}" fill="#fff8ea" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${deep}"/>
        <stop offset="0.55" stop-color="${accentTwo}"/>
        <stop offset="1" stop-color="${accent}"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.7" cy="0.25" r="0.7">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="${deep}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="500" height="750" fill="url(#bg)"/>
    <rect width="500" height="750" fill="url(#glow)"/>
    <circle cx="390" cy="120" r="150" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="1"/>
    <circle cx="390" cy="120" r="105" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1"/>
    <circle cx="390" cy="120" r="58" fill="#fff" fill-opacity="0.08"/>
    <path d="M0 430 C130 350 290 500 500 390 L500 750 L0 750 Z" fill="${deep}" fill-opacity="0.72"/>
    <g opacity="0.28" stroke="#fff" stroke-width="1">
      <path d="M46 54 H454"/>
      <path d="M46 696 H454"/>
    </g>
    <text x="46" y="86" fill="#fff8ea" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">CINESCOPE</text>
    <text x="46" y="662" fill="${accent}" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3">У КІНОТЕАТРІ</text>
    ${titleLines}
  </svg>`
}

function renderBackdrop(id, title) {
  const seed = hashText(`${title}-${id}`)
  const [accent, accentTwo, deep] = palettes[(seed + 2) % palettes.length]
  const label = escapeXml(String(title || 'CineScope').slice(0, 34))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${deep}"/>
        <stop offset="0.58" stop-color="${accentTwo}"/>
        <stop offset="1" stop-color="${accent}"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.72" cy="0.3" r="0.6">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.9"/>
        <stop offset="1" stop-color="${deep}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <rect width="1280" height="720" fill="url(#glow)"/>
    <circle cx="980" cy="170" r="255" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="2"/>
    <circle cx="980" cy="170" r="175" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="2"/>
    <path d="M0 620 C340 480 610 760 1280 520 L1280 720 L0 720 Z" fill="${deep}" fill-opacity="0.82"/>
    <text x="76" y="110" fill="#fff8ea" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="7">CINESCOPE ORIGINAL</text>
    <text x="76" y="590" fill="#fff8ea" font-family="Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
    <g opacity="0.28" stroke="#fff" stroke-width="1">
      <path d="M76 140 H1204"/>
      <path d="M76 650 H1204"/>
    </g>
  </svg>`
}

export const mediaRouter = Router()

mediaRouter.get('/poster/:id', (req, res) => {
  const title = String(req.query.title || 'Фільм')
  res.set('Cache-Control', 'public, max-age=86400')
  res.type('image/svg+xml').send(renderPoster(req.params.id, title))
})

mediaRouter.get('/backdrop/:id', (req, res) => {
  const title = String(req.query.title || 'CineScope')
  res.set('Cache-Control', 'public, max-age=86400')
  res.type('image/svg+xml').send(renderBackdrop(req.params.id, title))
})

mediaRouter.get('/tmdb/:size/:file', async (req, res) => {
  const { size, file } = req.params
  if (!allowedSizes.has(size) || !fileNamePattern.test(file)) {
    return res.status(400).json({ error: 'Некоректний шлях до зображення' })
  }

  const directory = path.join(config.imageCacheDir, size)
  const cachedFile = path.join(directory, file)

  try {
    const buffer = await readFile(cachedFile)
    res.set('Cache-Control', 'public, max-age=604800, immutable')
    return res.type(file.split('.').pop()).send(buffer)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  let response
  try {
    response = await fetch(`${config.imageBaseUrl}/${size}/${file}`, {
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    return res.status(502).json({ error: 'Зображення тимчасово недоступне' })
  }

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Зображення не знайдено' })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(directory, { recursive: true })
  await writeFile(cachedFile, buffer)
  res.set('Cache-Control', 'public, max-age=604800, immutable')
  res.type(response.headers.get('content-type') || 'image/jpeg').send(buffer)
})
