import { createHmac, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { getCookie } from '../auth.js'
import { readArtworks, readBids, readPurchases, readSubmissions, writeArtworks, writePurchases, writeSubmissions } from '../store.js'

const router = Router()
const COOKIE = 'art_gallery_admin'
const SESSION_SECONDS = 60 * 60 * 8
const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || ''

function signature(payload) {
  return createHmac('sha256', secret || 'admin-secret-not-configured').update(payload).digest('base64url')
}

function makeToken() {
  const payload = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS)
  return `${payload}.${signature(payload)}`
}

function validSession(request) {
  if (!secret) return false
  const token = getCookie(request, COOKIE)
  if (!token) return false
  const [expires, provided] = token.split('.')
  if (!/^\d+$/.test(expires || '') || Number(expires) <= Math.floor(Date.now() / 1000)) return false
  const expectedBuffer = Buffer.from(signature(expires))
  const providedBuffer = Buffer.from(provided || '')
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer)
}

function setAdminCookie(response, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure}`)
}

function clearAdminCookie(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`)
}

function requireAdmin(request, response, next) {
  if (!validSession(request)) return response.status(401).json({ error: 'Sign in to the admin studio to continue.' })
  next()
}

const categoryLabels = { 'traditional-art': 'Traditional', sculptures: 'Sculpture', 'modern-art': 'Modern' }

router.post('/login', (request, response) => {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!secret || !username || !password) return response.status(503).json({ error: 'Admin access is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and SESSION_SECRET in backend/.env.' })
  const suppliedUser = Buffer.from(String(request.body?.username || ''))
  const suppliedPassword = Buffer.from(String(request.body?.password || ''))
  const expectedUser = Buffer.from(username)
  const expectedPassword = Buffer.from(password)
  const userMatches = suppliedUser.length === expectedUser.length && timingSafeEqual(suppliedUser, expectedUser)
  const passwordMatches = suppliedPassword.length === expectedPassword.length && timingSafeEqual(suppliedPassword, expectedPassword)
  if (!userMatches || !passwordMatches) return response.status(401).json({ error: 'That username or password is not correct.' })
  setAdminCookie(response, makeToken())
  return response.json({ ok: true, username })
})

router.get('/me', (request, response) => {
  const authenticated = validSession(request)
  response.json(authenticated ? { authenticated: true, username: process.env.ADMIN_USERNAME } : { authenticated: false })
})

router.post('/logout', (request, response) => {
  clearAdminCookie(response)
  response.json({ ok: true })
})

router.get('/overview', requireAdmin, async (_request, response, next) => {
  try {
    const [artworks, bids, submissions, purchases] = await Promise.all([readArtworks(), readBids(), readSubmissions(), readPurchases()])
    const collection = artworks.map((artwork) => ({ ...artwork, status: purchases.some((purchase) => Number(purchase.artworkId) === Number(artwork.id)) ? 'sold' : 'available' }))
    return response.json({ artworks: collection, bids, submissions, purchases })
  } catch (error) { next(error) }
})

router.post('/submissions/:id/review', requireAdmin, async (request, response, next) => {
  try {
    const decision = request.body?.decision
    if (!['approve', 'decline'].includes(decision)) return response.status(400).json({ error: 'Choose approve or decline.' })
    const submissions = await readSubmissions()
    const submission = submissions.find((item) => item.id === request.params.id)
    if (!submission) return response.status(404).json({ error: 'Submission not found.' })
    if (submission.status !== 'pending') return response.status(409).json({ error: 'This submission has already been reviewed.' })
    if (decision === 'approve') {
      const artworks = await readArtworks()
      const artwork = { id: artworks.reduce((largest, item) => Math.max(largest, Number(item.id) || 0), 0) + 1, name: submission.title, artist: submission.artist, category: submission.category, kind: `${categoryLabels[submission.category] || 'Artwork'} · Artist submission`, price: Number(submission.price), image: submission.image, alt: submission.title }
      await writeArtworks([...artworks, artwork])
      submission.status = 'approved'
      submission.artworkId = artwork.id
    } else submission.status = 'declined'
    submission.reviewedAt = new Date().toISOString()
    await writeSubmissions(submissions)
    return response.json({ submission })
  } catch (error) { next(error) }
})

router.post('/purchases', requireAdmin, async (request, response, next) => {
  try {
    const artworkId = Number(request.body?.artworkId)
    const buyer = typeof request.body?.buyer === 'string' ? request.body.buyer.trim() : ''
    const amount = Number(request.body?.amount)
    const date = typeof request.body?.date === 'string' ? request.body.date : ''
    if (!Number.isSafeInteger(artworkId) || !buyer || buyer.length > 120 || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return response.status(400).json({ error: 'Enter an artwork, buyer, sale amount, and valid date.' })
    }
    const [artworks, purchases] = await Promise.all([readArtworks(), readPurchases()])
    const artwork = artworks.find((item) => Number(item.id) === artworkId)
    if (!artwork) return response.status(404).json({ error: 'Artwork not found.' })
    if (purchases.some((item) => Number(item.artworkId) === artworkId)) return response.status(409).json({ error: 'A sale has already been recorded for this artwork.' })
    const purchase = { id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, artworkId, artwork: artwork.name, artist: artwork.artist, buyer, amount, date, recordedAt: new Date().toISOString() }
    await writePurchases([purchase, ...purchases])
    return response.status(201).json({ purchase })
  } catch (error) { next(error) }
})

export default router
