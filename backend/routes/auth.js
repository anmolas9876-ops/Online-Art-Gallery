import { Router } from 'express'
import { clearSessionCookie, createSessionToken, getCookie, getSessionUserId, hashPassword, SESSION_COOKIE, sessionCookie, verifyPassword } from '../auth.js'
import { readUsers, writeUsers } from '../store.js'

const router = Router()

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function setSession(response, user) {
  response.setHeader('Set-Cookie', sessionCookie(createSessionToken(user.id)))
  return response.json({ user: publicUser(user) })
}

router.post('/register', async (request, response, next) => {
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
    const password = typeof request.body?.password === 'string' ? request.body.password : ''
    if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128) {
      return response.status(400).json({ error: 'Enter a name, valid email, and password of at least 8 characters.' })
    }
    const users = await readUsers()
    if (users.some((user) => user.email === email)) return response.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })
    const { salt, passwordHash } = await hashPassword(password)
    const user = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, name, email, salt, passwordHash, createdAt: new Date().toISOString() }
    await writeUsers([...users, user])
    return setSession(response.status(201), user)
  } catch (error) { next(error) }
})

router.post('/login', async (request, response, next) => {
  try {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
    const password = typeof request.body?.password === 'string' ? request.body.password : ''
    const users = await readUsers()
    const user = users.find((item) => item.email === email)
    if (!user || !await verifyPassword(password, user.salt, user.passwordHash)) {
      return response.status(401).json({ error: 'Email or password is incorrect.' })
    }
    return setSession(response, user)
  } catch (error) { next(error) }
})

router.get('/me', async (request, response, next) => {
  try {
    const userId = getSessionUserId(getCookie(request, SESSION_COOKIE))
    if (!userId) return response.json({ user: null })
    const user = (await readUsers()).find((item) => item.id === userId)
    if (!user) {
      response.setHeader('Set-Cookie', clearSessionCookie())
      return response.json({ user: null })
    }
    return response.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})

router.post('/logout', (_request, response) => {
  response.setHeader('Set-Cookie', clearSessionCookie())
  response.json({ ok: true })
})

export default router
