import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../auth.js'
import { config } from '../config.js'
import {
  createUser,
  findUserByEmail,
  publicUser,
} from '../store.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' })
}

function authPayload(user) {
  return {
    token: createToken(user),
    user: publicUser(user),
  }
}

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (name.length < 2) {
    return res.status(400).json({ error: 'Імʼя має містити щонайменше 2 символи' })
  }
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Введіть коректну електронну адресу' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль має містити щонайменше 6 символів' })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'Користувач із такою поштою вже існує' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser({ name, email, passwordHash })
  res.status(201).json(authPayload(user))
})

authRouter.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const user = findUserByEmail(email)

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Невірна пошта або пароль' })
  }

  res.json(authPayload(user))
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})
