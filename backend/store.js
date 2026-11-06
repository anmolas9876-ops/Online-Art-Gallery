import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { get, put } from '@vercel/blob'

const localPaths = {
  artworks: fileURLToPath(new URL('./data/artworks.json', import.meta.url)),
  bids: fileURLToPath(new URL('./data/bids.json', import.meta.url)),
  submissions: fileURLToPath(new URL('./data/submissions.json', import.meta.url)),
  users: fileURLToPath(new URL('./data/users.json', import.meta.url)),
  purchases: fileURLToPath(new URL('./data/purchases.json', import.meta.url)),
}

const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL && process.env.VERCEL_OIDC_TOKEN))
const onVercel = Boolean(process.env.VERCEL)
export const storageMode = blobConfigured ? 'private-blob' : onVercel ? 'not-configured' : 'local-files'

async function readLocalList(path) {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'))
    return Array.isArray(value) ? value : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function readList(name) {
  if (!blobConfigured) {
    if (onVercel) throw new Error('Private gallery storage is not configured.')
    return readLocalList(localPaths[name])
  }

  const stored = await get(`gallery/${name}.json`, { access: 'private', useCache: false })
  if (!stored) return readLocalList(localPaths[name])
  if (stored.statusCode !== 200 || !stored.stream) throw new Error(`Could not read gallery ${name} storage.`)
  const value = JSON.parse(await new Response(stored.stream).text())
  if (!Array.isArray(value)) throw new Error(`Gallery ${name} storage is invalid.`)
  return value
}

async function writeList(name, items) {
  const body = `${JSON.stringify(items)}\n`
  if (!blobConfigured) {
    if (onVercel) throw new Error('Private gallery storage is not configured.')
    return writeFile(localPaths[name], `${JSON.stringify(items, null, 2)}\n`, 'utf8')
  }
  await put(`gallery/${name}.json`, body, {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  })
}

export const readArtworks = () => readList('artworks')
export const writeArtworks = (artworks) => writeList('artworks', artworks)
export const readBids = () => readList('bids')
export const writeBids = (bids) => writeList('bids', bids)
export const readSubmissions = () => readList('submissions')
export const writeSubmissions = (items) => writeList('submissions', items)
export const readUsers = () => readList('users')
export const writeUsers = (users) => writeList('users', users)
export const readPurchases = () => readList('purchases')
export const writePurchases = (purchases) => writeList('purchases', purchases)
