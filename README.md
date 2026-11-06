# Azure Galleria

The React gallery uses a Vite frontend and an Express API. The original static files remain in the project root.

## Start the gallery

Install dependencies once in each app folder:

```powershell
npm install --prefix frontend
npm install --prefix backend
```

Then start both services with one command:

```powershell
cd frontend
npm run dev
```

This starts the gallery frontend and the API together. Vite prints the local website address; the API runs on port 5000 and handles `/api` requests. Stop both services with `Ctrl+C` in that terminal.

The API can also be started separately with `npm run dev --prefix backend`. Copy `backend/.env.example` to `backend/.env` before deployment and set a long random `SESSION_SECRET`. Artwork, bids, and password hashes are stored in `backend/data/`; account data is local and ignored by Git. Artwork submissions are saved with `pending` status for gallery review.

## Admin Studio

Open `/admin` on the same local gallery address. Before signing in, copy `backend/.env.example` to `backend/.env` and set private values for `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `SESSION_SECRET`. Never commit `backend/.env`. The Admin Studio reads live artwork, bids, and submissions from the API. Since the gallery does not process checkout payments, completed sales must be entered as records in the Sales desk.

Available endpoints: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/artworks`, `GET /api/bids`, `POST /api/bids`, `POST /api/submissions`, and protected Admin Studio endpoints under `/api/admin`.
