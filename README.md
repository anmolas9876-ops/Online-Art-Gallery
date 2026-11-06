# Art Gallery React migration

The gallery is split into a Vite + React frontend and an Express API. The existing `Gallery.html`, `admin.html`, CSS, and scripts in the project root are left in place as the original version.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite serves the React gallery at `http://localhost:5173` and proxies `/api` calls to the API server.

## Backend

```powershell
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:5000`. Copy `.env.example` to `.env` to set the port, frontend origin, and session secret. Artwork, bids, and registered account password hashes are stored in `data/`; account data is local and ignored by Git. Artwork submissions are saved with `pending` status for gallery review.

Available endpoints: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/artworks`, `GET /api/bids`, `POST /api/bids`, and `POST /api/submissions`.
