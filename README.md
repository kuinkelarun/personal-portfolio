# Personal Portfolio – React + Flask on Render

A modern, responsive personal portfolio built with React (Vite + Tailwind CSS) and Flask, deployable on Render using two services: a Python Web Service for the API backend and a Static Site for the frontend.

## Features
- React 18 + Vite + Tailwind CSS, responsive and fast
- Sections: Home, Experience, Projects (from API), About/Skills, Contact (POST to API)
- Flask backend with REST APIs, CORS, rate-limited contact endpoint, SQLite (optional) for messages
- Environment variables for secrets and config (locally via .env, on Render via dashboard)
- SEO basics: meta tags, robots.txt, sitemap.xml
- Ready-to-deploy Render blueprint (render.yaml) for both services

## Directory Structure

portfolio-app/
- backend/
  - app.py
  - requirements.txt
  - .env.example
- frontend/
  - package.json
  - index.html
  - vite.config.js
  - postcss.config.js
  - tailwind.config.js
  - .env.example
  - public/
    - robots.txt
    - sitemap.xml
  - src/
    - index.css
    - main.jsx
    - App.jsx
    - components/
      - Navbar.jsx
      - Footer.jsx
      - ProjectCard.jsx
    - pages/
      - Home.jsx
      - Experience.jsx
      - Projects.jsx
      - About.jsx
      - Contact.jsx
    - data/
      - experience.js
- render.yaml
- README.md

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend (Flask)
1. Create and activate a virtual environment, then install deps:

```powershell
cd "backend"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Create `.env` from example and set values:

```powershell
Copy-Item .env.example .env
```

3. Run the API (auto-reload for dev):

```powershell
$env:FLASK_APP="app.py"; $env:FLASK_ENV="development"; flask run --port 5000
```

The API will be at http://localhost:5000

### Frontend (React + Vite)
1. Install dependencies:

```powershell
cd "../frontend"
npm install
```

2. Create `.env` from example and set the API base URL (for local dev this is usually http://localhost:5000):

```powershell
Copy-Item .env.example .env
```

3. Run the dev server:

```powershell
npm run dev
```

The app will be at the URL printed in the terminal (default http://localhost:5173).

## API Endpoints
- GET `/api/health` → `{ status: "ok" }`
- GET `/api/projects` → Array of project objects: `{ id, title, description, tags, links: { github?, demo? } }`
- POST `/api/contact` → `{ success: true }` on valid submission, rate-limited and validated. Body JSON:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "message": "Hello there!"
}
```

## Deployment on Render

You can use the provided `render.yaml` blueprint to set up both services, or create them manually in the dashboard.

### Option A: Render Blueprint (recommended)
1. Push this repository to GitHub.
2. In Render, create a New Blueprint and point to your repo. It will detect `render.yaml` and propose two services.
3. After creation, go to the frontend Static Site’s Environment tab and set `VITE_API_BASE_URL` to your backend’s public URL (e.g., `https://portfolio-backend.onrender.com`). Redeploy the static site.
4. In the backend Web Service, set environment variables in the dashboard (see below) and deploy.

### Option B: Manual setup in Render
- Backend (Web Service)
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `gunicorn app:app`
  - Python runtime will be auto-detected from `requirements.txt`
- Frontend (Static Site)
  - Build Command: `npm ci && npm run build`
  - Publish Directory: `dist`
  - Set env `VITE_API_BASE_URL` to backend URL

### Environment Variables
Set these in the Render dashboard for each service.

Backend (Web Service):
- `FLASK_ENV=production`
- `SECRET_KEY=your_secret_key_here`
- `FRONTEND_URL=https://arunkuinkel.onrender.com` (or your domain)
- `CORS_ALLOWED_ORIGINS=https://arunkuinkel.onrender.com` (comma-separated if multiple)
- `RATE_LIMIT=5/minute` (tune as needed)

Frontend (Static Site):
- `VITE_API_BASE_URL=https://portfolio-backend.onrender.com`

## Notes & Best Practices
- HTTPS: Render provides it automatically for custom domains.
- CORS: Locked to your frontend domain via env variables.
- Secrets: Use environment variables; do not commit secrets.
- Rate limiting: Contact endpoint is limited by IP to reduce abuse.
- SQLite storage on Render free tier is ephemeral; add a persistent disk for durability or switch to a managed DB if needed.
- SEO: Update `public/sitemap.xml` and `public/robots.txt` with your domain.

## License
MIT (adjust as desired)
