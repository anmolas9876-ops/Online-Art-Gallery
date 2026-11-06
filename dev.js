import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.join(projectRoot, 'backend')
const frontendDir = path.join(projectRoot, 'frontend')
const viteEntry = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js')

if (!existsSync(path.join(backendDir, 'node_modules', 'express'))) {
  console.error('Backend packages are missing. From the project folder, run: npm install --prefix backend')
  process.exit(1)
}
if (!existsSync(viteEntry)) {
  console.error('Frontend packages are missing. From the project folder, run: npm install --prefix frontend')
  process.exit(1)
}

const api = spawn(process.execPath, ['server.js'], { cwd: backendDir, stdio: 'inherit', env: process.env })
const frontend = spawn(process.execPath, [viteEntry, '--host', '127.0.0.1'], { cwd: frontendDir, stdio: 'inherit', env: process.env })
let stopping = false

function stop(code = 0) {
  if (stopping) return
  stopping = true
  if (api.exitCode === null) api.kill()
  if (frontend.exitCode === null) frontend.kill()
  process.exitCode = code
}

api.on('error', (error) => { console.error('Could not start the gallery API:', error.message); stop(1) })
frontend.on('error', (error) => { console.error('Could not start the gallery frontend:', error.message); stop(1) })
api.on('exit', (code) => { if (!stopping) { console.error(`Gallery API exited${code === null ? '' : ` with code ${code}`}.`); stop(code || 1) } })
frontend.on('exit', (code) => { if (!stopping) { console.error(`Gallery frontend exited${code === null ? '' : ` with code ${code}`}.`); stop(code || 1) } })
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
