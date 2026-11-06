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

The API listens on `http://localhost:5000`. Copy `.env.example` to `.env` to override the port or frontend origin. Artwork and bid data are stored in `data/`; artwork submissions are saved with `pending` status for gallery review.

Available endpoints: `GET /api/health`, `GET /api/artworks`, `GET /api/bids`, `POST /api/bids`, and `POST /api/submissions`.
