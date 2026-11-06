import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
export const SESSION_COOKIE = 'art_gallery_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const sessionSecret = process.env.SESSION_SECRET || 'local-development-secret-change-before-deploying'

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64)
  return { salt, passwordHash: derived.toString('hex') }
}

export async function verifyPassword(password, salt, expectedHash) {
  const derived = await scrypt(password, salt, 64)
  const expected = Buffer.from(expectedHash, 'hex')
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}

function sign(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url')
}

export function createSessionToken(userId) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS}`
  return `${payload}.${sign(payload)}`
}

export function getSessionUserId(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, expiresText, signature] = parts
  const payload = `${userId}.${expiresText}`
  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  if (!/^\d+$/.test(expiresText) || Number(expiresText) <= Math.floor(Date.now() / 1000)) return null
  return userId
}

export function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure}`
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
}

export function getCookie(request, name) {
  const cookies = request.headers.cookie || ''
  for (const item of cookies.split(';')) {
    const separator = item.indexOf('=')
    if (separator < 0) continue
    if (item.slice(0, separator).trim() === name) return decodeURIComponent(item.slice(separator + 1).trim())
  }
  return null
}
