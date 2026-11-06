import { Router } from 'express'
import { readArtworks, readBids, readPurchases } from '../store.js'

const router = Router()

router.get('/', async (_request, response, next) => {
  try {
    const [artworks, bids, purchases] = await Promise.all([readArtworks(), readBids(), readPurchases()])
    response.json(artworks.map((artwork) => {
      const purchase = purchases.find((item) => Number(item.artworkId) === Number(artwork.id))
      return {
        ...artwork,
        status: purchase ? 'sold' : 'available',
        ...(purchase ? { salePrice: Number(purchase.amount) } : {}),
        price: bids.filter((bid) => bid.artworkId === artwork.id).reduce((highest, bid) => Math.max(highest, bid.amount), artwork.price),
      }
    }))
  } catch (error) { next(error) }
})

export default router
