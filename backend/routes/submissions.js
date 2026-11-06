import { Router } from 'express'
import { readSubmissions, writeSubmissions } from '../store.js'

const router = Router()

router.post('/', async (request, response, next) => {
  try {
    const { artist, title, category, image, story = '' } = request.body || {}
    const price = Number(request.body?.price)
    const allowedCategories = ['traditional-art', 'sculptures', 'modern-art']
    if (typeof artist !== 'string' || !artist.trim() || artist.length > 80 || typeof title !== 'string' || !title.trim() || title.length > 120 || !allowedCategories.includes(category) || typeof image !== 'string' || image.length > 2048 || !Number.isFinite(price) || price < 1 || typeof story !== 'string' || story.length > 600) {
      return response.status(400).json({ error: 'Check the artwork details and try again.' })
    }
    let parsedImage
    try { parsedImage = new URL(image) } catch { return response.status(400).json({ error: 'Provide a valid artwork image URL.' }) }
    if (!['https:', 'http:'].includes(parsedImage.protocol)) return response.status(400).json({ error: 'Provide a valid artwork image URL.' })
    const submissions = await readSubmissions()
    const submission = { id: `submission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, artist: artist.trim(), title: title.trim(), category, image: parsedImage.href, price, story: story.trim(), status: 'pending', submittedAt: new Date().toISOString() }
    await writeSubmissions([submission, ...submissions])
    response.status(201).json({ id: submission.id, status: submission.status })
  } catch (error) { next(error) }
})

export default router
