import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import artworksRouter from './routes/artworks.js'
import bidsRouter from './routes/bids.js'
import submissionsRouter from './routes/submissions.js'
import authRouter from './routes/auth.js'

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '32kb' }))
app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'art-gallery-api' }))
app.use('/api/auth', authRouter)
app.use('/api/artworks', artworksRouter)
app.use('/api/bids', bidsRouter)
app.use('/api/submissions', submissionsRouter)
app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'The gallery service could not complete this request.' })
})

app.listen(port, () => console.log(`Art Gallery API listening on http://localhost:${port}`))
