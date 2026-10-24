import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { findUserById, publicUser } from './store.js'

function readToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  return header.slice(7)
}

function resolveUser(token) {
  if (!token) return null
  const payload = jwt.verify(token, config.jwtSecret)
  const user = findUserById(payload.sub)
  return user || null
}

export function optionalAuth(req, res, next) {
  try {
    const user = resolveUser(readToken(req))
    req.user = publicUser(user)
  } catch {
    req.user = null
  }
  next()
}

export function requireAuth(req, res, next) {
  try {
    const user = resolveUser(readToken(req))
    if (!user) {
      return res.status(401).json({ error: 'Потрібно увійти в акаунт' })
    }
    req.user = publicUser(user)
    next()
  } catch {
    return res.status(401).json({ error: 'Сесія недійсна, увійдіть знову' })
  }
}
