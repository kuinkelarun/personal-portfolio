import os
import sqlite3
import json
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from pathlib import Path
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

# Load environment from .env when available (local dev)
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
FRONTEND_URL = os.getenv("FRONTEND_URL")
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS")
RATE_LIMIT = os.getenv("RATE_LIMIT", "5/minute")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///messages.db")

app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False

# CORS setup: restrict to provided origins or allow localhost for dev
cors_origins = []
if CORS_ALLOWED_ORIGINS:
    cors_origins = [o.strip() for o in CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
elif FRONTEND_URL:
    cors_origins = [FRONTEND_URL]
else:
    # Development fallback - include multiple ports for flexibility
    cors_origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175"
    ]

CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=False)

limiter = Limiter(get_remote_address, app=app, default_limits=[])

# --- SQLite helpers ---

def _db_path_from_url(url: str) -> str:
    # Expecting sqlite:///path pattern
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "")
    # default to a local file name
    return "messages.db"

DB_PATH = _db_path_from_url(DATABASE_URL)


def init_db():
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                ip TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


init_db()

# --- Content storage helpers ---
def _get_content(key: str):
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("SELECT value FROM content WHERE key = ?", (key,))
        row = cur.fetchone()
        if not row:
            return None
        try:
            return json.loads(row[0])
        except Exception:
            return row[0]

def _set_content(key: str, value):
    text = json.dumps(value)
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("INSERT INTO content(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, text))
        conn.commit()

# Initialize default content if missing
def _ensure_default_content():
    defaults = {
        "about": {
            "name": "Your Name",
            "headline": "Hi, I'm",
            "tagline": "Full-Stack Developer | Software Engineer | Tech Enthusiast",
            "summary": "Building modern web applications with clean code and elegant design. Passionate about creating user-friendly experiences that make a difference.",
            "bio": "I'm passionate about building innovative solutions that make a difference. With a strong foundation in software development and a keen eye for design, I create applications that are both functional and beautiful.",
            "profileImage": "",
            "socialLinks": {
                "github": "",
                "linkedin": "",
                "twitter": ""
            },
            "highlights": [
                {"icon": "🎯", "title": "Focused", "description": "Dedicated to delivering high-quality solutions"},
                {"icon": "🚀", "title": "Innovative", "description": "Always exploring new technologies and approaches"},
                {"icon": "💡", "title": "Creative", "description": "Thinking outside the box to solve problems"},
                {"icon": "🤝", "title": "Collaborative", "description": "Working effectively with teams and stakeholders"}
            ]
        },
        "experience": [
            {
                "company": "Tech Company",
                "role": "Software Engineer",
                "period": "2022 - Present",
                "summary": "Building scalable web applications and leading development initiatives.",
                "responsibilities": [
                    "Developed and maintained web applications",
                    "Led a team of developers",
                    "Implemented CI/CD pipelines"
                ],
                "technologies": ["React", "Node.js", "PostgreSQL", "Docker"]
            }
        ],
        "projects": [],
        "skills": {
            "technical": ["JavaScript", "Python", "React", "Node.js", "SQL"],
            "tools": ["Git", "Docker", "VS Code", "AWS"],
            "soft": ["Communication", "Problem Solving", "Teamwork", "Leadership"],
            "other": []
        },
        "contact": {
            "email": "your.email@example.com",
            "phone": "",
            "location": ""
        },
        "layout": {
            "sections": ["home", "about", "experience", "projects", "skills", "contact"]
        }
    }
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            "CREATE TABLE IF NOT EXISTS content (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
        )
        conn.commit()
    for k, v in defaults.items():
        if _get_content(k) is None:
            _set_content(k, v)


_ensure_default_content()

# Ensure uploads directory exists for admin image uploads
UPLOAD_DIR = Path(os.path.join(os.path.dirname(DB_PATH) or '.', 'static', 'uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.post('/api/upload')
def upload_file():
    # Simple admin-protected upload endpoint
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'empty filename'}), 400
    filename = secure_filename(f.filename)
    dest = UPLOAD_DIR / filename
    try:
        f.save(str(dest))
    except Exception as e:
        return jsonify({'error': 'failed to save file'}), 500
    # Return a URL that the frontend can use
    url = f"{request.url_root.rstrip('/')}/static/uploads/{filename}"
    return jsonify({'url': url})

# --- Sample data (can later come from DB) ---
PROJECTS = [
    {
        "id": 1,
        "title": "Gun Death Analysis",
        "description": "The notebook analyzes a comprehensive, 2012–2014 U.S. gun-death dataset (originally drawn from the CDC’s Multiple Cause of Death database via FiveThirtyEight) to identify which demographic and situational factors are most predictive of a fatality being classified as a suicide versus another intent (homicide, accident, etc.). After cleaning and encoding features like age, gender, race, place of death and education level, the team fits and compares several supervised classifiers—most notably regularized logistic regression, random forest and gradient-boosted decision trees—using cross-validation. Models are evaluated with ROC-AUC, precision/recall and confusion matrices, and feature importances or regression coefficients are examined to surface the strongest predictors of suicide.",
        "tags": ["Python", "Pandas", "scikit-learn", "ML"],
        "links": {
            "github": "https://github.com/kuinkelarun/Gun-Death-Analysis",
            "demo": "https://your-ds-demo.example.com"
        }
    },
    {
        "id": 3,
        "title": "Nepali Calendar App",
        "description": "Interactive Nepali calendar with events and holidays, built for the web.",
        "tags": ["React", "Calendar", "i18n"],
        "links": {
            "github": "https://family-tree-crm.web.app/",
            "demo": "https://your-calendar.example.com"
        }
    },
    {
        "id": 4,
        "title": "Boston Housing",
        "description": "An analysis of the Boston Housing dataset using various machine learning techniques.",
        "tags": ["Python", "Pandas", "scikit-learn", "ML"],
        "links": {
            "github": "https://github.com/kuinkelarun/Boston-Housing-Data-Q4",
            "demo": "https://your-boston-housing.example.com"
        }
    }
]


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/projects")
def get_projects():
    # Prefer projects stored in content table so admin edits are reflected.
    val = _get_content('projects')
    if isinstance(val, list):
        return jsonify(val)
    return jsonify(PROJECTS)


def _validate_contact(payload: dict):
    errors = {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    message = (payload.get("message") or "").strip()

    if not name or len(name) < 2:
        errors["name"] = "Name is required and should be at least 2 characters."
    if not email or "@" not in email:
        errors["email"] = "A valid email is required."
    if not message or len(message) < 10:
        errors["message"] = "Message should be at least 10 characters."

    return errors


@app.post("/api/contact")
@limiter.limit(RATE_LIMIT)
def contact():
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json(silent=True) or {}
    errors = _validate_contact(data)
    if errors:
        return jsonify({"errors": errors}), 422

    name = data["name"].strip()
    email = data["email"].strip()
    message = data["message"].strip()
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    created_at = datetime.utcnow().isoformat()

    try:
        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO messages (name, email, message, ip, created_at) VALUES (?, ?, ?, ?, ?)",
                (name, email, message, ip, created_at),
            )
            conn.commit()
    except Exception as e:
        # On Render free tier, FS can be ephemeral. Log error but do not leak internals.
        return jsonify({"success": False, "message": "Unable to store message right now."}), 503

    return jsonify({"success": True})


@app.get("/api/stats")
def stats():
    # Example stats endpoint
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM messages")
            (count,) = cur.fetchone()
    except Exception:
        count = 0
    return jsonify({
        "project_count": len(PROJECTS),
        "message_count": count,
    })


# --- Content API ---
def _is_admin(request):
    admin_token = os.getenv("ADMIN_TOKEN", "dev-token")
    # Header `X-ADMIN-TOKEN` or query param `admin_token`
    provided = request.headers.get("X-ADMIN-TOKEN") or request.args.get("admin_token")
    return provided and provided == admin_token


@app.get('/api/content')
def get_all_content():
    # Return all content keys
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM content")
        rows = cur.fetchall()
    data = {}
    for k, v in rows:
        try:
            data[k] = json.loads(v)
        except Exception:
            data[k] = v
    return jsonify(data)


@app.get('/api/content/<key>')
def get_content(key):
    val = _get_content(key)
    if val is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(val)


@app.put('/api/content/<key>')
def put_content(key):
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    if not request.is_json:
        return jsonify({"error": "expected json body"}), 400
    val = request.get_json()
    try:
        _set_content(key, val)
    except Exception as e:
        return jsonify({"error": "failed to write content"}), 500
    return jsonify({"success": True})


if __name__ == "__main__":
    # For local debug only; in Render use gunicorn app:app
    app.run(host="0.0.0.0", port=5000, debug=True)
