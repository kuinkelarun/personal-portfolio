# Personal Portfolio – React + Flask on Vercel & Render

A modern, responsive personal portfolio built with React (Vite + Tailwind CSS) and Flask, deployed on Vercel (frontend) and Render (backend).

**Live Site:** [https://personal-portfolio-ten-phi-73.vercel.app/](https://personal-portfolio-ten-phi-73.vercel.app/)

## Features
- React 18 + Vite + Tailwind CSS, responsive and fast
- Sections: Home, Experience, Projects (from API), About/Skills, Contact (POST to API)
- Flask backend with REST APIs, CORS, rate-limited contact endpoint, SQLite (optional) for messages
- Environment variables for secrets and config (locally via .env, on Vercel/Render via dashboard)
- SEO basics: meta tags, robots.txt, sitemap.xml
- Admin panel for content management
- Ready-to-deploy on Vercel (frontend) and Render (backend)

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

## Deployment

### Frontend on Vercel
1. Push this repository to GitHub.
2. In Vercel, create a New Project and point to your repo, selecting the `frontend/` folder as the root directory.
3. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables (Production):
   - `VITE_API_BASE_URL=https://your-backend.railway.app` (replace with your Railway backend URL)
5. Deploy. The site will be available at a Vercel domain (e.g., `https://personal-portfolio-ten-phi-73.vercel.app`).

### Backend on Railway (Recommended for Reliability)
Railway offers persistent apps with no inactivity sleep on their free tier (with $5 trial credits).

1. Sign up at [railway.app](https://railway.app) and connect your GitHub account.
2. Create a New Project → Deploy from GitHub Repo → Select your repo.
3. Configure:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT --workers 2 app:app`
4. Environment Variables:
   - `FLASK_ENV=production`
   - `SECRET_KEY=your_secret_key_here`
   - `FRONTEND_URL=https://personal-portfolio-ten-phi-73.vercel.app` (your Vercel domain)
   - `CORS_ALLOWED_ORIGINS=https://personal-portfolio-ten-phi-73.vercel.app`
   - `RATE_LIMIT=5/minute`
   - `ADMIN_TOKEN=your_secure_admin_token`
5. Deploy. The API will be available at a Railway domain (e.g., `https://your-app.up.railway.app`).

## Notes & Best Practices
- HTTPS: Vercel and Render provide it automatically for custom domains.
- CORS: Locked to your frontend domain via env variables on the backend.
- Secrets: Use environment variables; do not commit secrets.
- Rate limiting: Contact endpoint is limited by IP to reduce abuse.
- SQLite storage on Render free tier is ephemeral; add a persistent disk for durability or switch to a managed DB if needed.
- SEO: Update `public/sitemap.xml` and `public/robots.txt` with your domain.
- Admin Access: Use `/admin` on the frontend with the `ADMIN_TOKEN` set in the backend.
- Backup: Use the `/api/admin/download-db` endpoint to backup SQLite data.

## License
MIT (adjust as desired)