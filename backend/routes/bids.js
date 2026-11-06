import { Router } from 'express'
import { readArtworks, readBids, writeBids } from '../store.js'
import { getCookie, getSessionUserId, SESSION_COOKIE } from '../auth.js'

const router = Router()

router.get('/mine', async (request, response, next) => {
  try {
    const userId = getSessionUserId(getCookie(request, SESSION_COOKIE))
    if (!userId) return response.status(401).json({ error: 'Sign in to view bids saved to your account.' })
    const bids = (await readBids()).filter((bid) => bid.userId === userId)
    return response.json({ bids })
  } catch (error) { next(error) }
})

router.get('/', async (_request, response, next) => {
  try { response.json(await readBids()) } catch (error) { next(error) }
})

router.post('/', async (request, response, next) => {
  try {
    const artworkId = Number(request.body?.artworkId)
    const amount = Number(request.body?.amount)
    const bidder = typeof request.body?.bidder === 'string' ? request.body.bidder.trim() : ''
    if (!Number.isSafeInteger(artworkId) || !Number.isFinite(amount) || amount <= 0 || !bidder || bidder.length > 80) {
      return response.status(400).json({ error: 'Provide an artwork and a valid bid amount.' })
    }
    const artworks = await readArtworks()
    const artwork = artworks.find((item) => item.id === artworkId)
    if (!artwork) return response.status(404).json({ error: 'Artwork not found.' })
    if (amount <= artwork.price) return response.status(400).json({ error: 'Bid must be higher than the current bid.' })

    const bids = await readBids()
    const highest = bids.filter((bid) => bid.artworkId === artworkId).reduce((value, bid) => Math.max(value, bid.amount), artwork.price)
    if (amount <= highest) return response.status(409).json({ error: 'A higher bid has already been placed.' })
    const userId = getSessionUserId(getCookie(request, SESSION_COOKIE))
    const bid = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, artworkId, artwork: artwork.name, bidder, amount, ...(userId ? { userId } : {}), createdAt: new Date().toISOString() }
    await writeBids([bid, ...bids])
    response.status(201).json(bid)
  } catch (error) { next(error) }
})

export default router
