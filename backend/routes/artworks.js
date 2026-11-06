import { Router } from 'express'
import { readArtworks, readBids } from '../store.js'

const router = Router()

router.get('/', async (_request, response, next) => {
  try {
    const [artworks, bids] = await Promise.all([readArtworks(), readBids()])
    response.json(artworks.map((artwork) => ({
      ...artwork,
      price: bids.filter((bid) => bid.artworkId === artwork.id).reduce((highest, bid) => Math.max(highest, bid.amount), artwork.price),
    })))
  } catch (error) { next(error) }
})

export default router
