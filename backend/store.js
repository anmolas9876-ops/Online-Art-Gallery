import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const bidsPath = fileURLToPath(new URL('./data/bids.json', import.meta.url))
const submissionsPath = fileURLToPath(new URL('./data/submissions.json', import.meta.url))
const artworksPath = fileURLToPath(new URL('./data/artworks.json', import.meta.url))
const usersPath = fileURLToPath(new URL('./data/users.json', import.meta.url))

async function readList(path) {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'))
    return Array.isArray(value) ? value : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

export const readArtworks = () => readList(artworksPath)
export const readBids = () => readList(bidsPath)
export const writeBids = (bids) => writeFile(bidsPath, `${JSON.stringify(bids, null, 2)}\n`, 'utf8')
export const readSubmissions = () => readList(submissionsPath)
export const writeSubmissions = (items) => writeFile(submissionsPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8')
export const readUsers = () => readList(usersPath)
export const writeUsers = (users) => writeFile(usersPath, `${JSON.stringify(users, null, 2)}\n`, 'utf8')
