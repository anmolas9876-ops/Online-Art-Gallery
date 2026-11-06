import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import artworksRouter from './routes/artworks.js'
import bidsRouter from './routes/bids.js'
import submissionsRouter from './routes/submissions.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import { storageMode } from './store.js'

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '32kb' }))
app.get('/api/health', (_request, response) => response.status(storageMode === 'not-configured' ? 503 : 200).json({ status: storageMode === 'not-configured' ? 'storage-not-configured' : 'ok', service: 'azure-galleria-api', storage: storageMode }))
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/artworks', artworksRouter)
app.use('/api/bids', bidsRouter)
app.use('/api/submissions', submissionsRouter)
app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'The gallery service could not complete this request.' })
})

if (process.env.VERCEL !== '1') app.listen(port, () => console.log(`Azure Galleria API listening on http://localhost:${port}`))

export default app
