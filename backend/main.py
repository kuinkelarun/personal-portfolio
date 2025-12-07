import os
import sqlite3
import json
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, redirect
from werkzeug.utils import secure_filename
from pathlib import Path
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

# Load environment from .env when available (local dev)
load_dotenv()

# Configuration
CERTAIN_FRONTEND = "https://personal-portfolio-ten-phi-73.vercel.app"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
# Prefer an explicit env var, otherwise fall back to the known frontend URL for your deployment
FRONTEND_URL = os.getenv("FRONTEND_URL", CERTAIN_FRONTEND)
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS")
RATE_LIMIT = os.getenv("RATE_LIMIT", "5/minute")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///messages.db")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "admin")

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


# Fallback: ensure CORS headers are present on all responses (helpful for local dev)
@app.after_request
def _force_cors_headers(response):
    try:
        origin = request.headers.get("Origin")
        # In development, mirror the Origin header so 127.0.0.1 vs localhost mismatches don't block preflight
        env = os.getenv("FLASK_ENV", "").lower()
        if env == "development" and origin:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            if origin and (origin in cors_origins or "*" in cors_origins):
                response.headers["Access-Control-Allow-Origin"] = origin
            elif cors_origins:
                response.headers["Access-Control-Allow-Origin"] = cors_origins[0]
            else:
                response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-ADMIN-TOKEN"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    except Exception:
        # Be conservative: don't fail the request if header injection fails
        pass
    return response

# --- Database helpers (SQLAlchemy if available, otherwise fallback SQLite) ---
USE_DB_MODULE = False
try:
    from .db import init_db as db_init, _get_content as db_get_content, _set_content as db_set_content, get_all_content as db_get_all_content, get_all_messages as db_get_all_messages, insert_message as db_insert_message, count_messages as db_count_messages, DB_PATH as DB_PATH
    USE_DB_MODULE = True
except Exception:
    try:
        from db import init_db as db_init, _get_content as db_get_content, _set_content as db_set_content, get_all_content as db_get_all_content, DB_PATH as DB_PATH
        USE_DB_MODULE = True
    except Exception:
        USE_DB_MODULE = False

if USE_DB_MODULE:
    def init_db():
        return db_init()

    def _get_content(key: str):
        return db_get_content(key)

    def _set_content(key: str, value):
        return db_set_content(key, value)

    def _get_all_content():
        return db_get_all_content()

else:
    def _db_path_from_url(url: str) -> str:
        if url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "")
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

    def _get_all_content():
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
        return data

init_db()

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


# If the content table has no `projects` entry, seed it with the in-file sample PROJECTS
# This makes the admin UI show example projects out-of-the-box without requiring a manual
# PUT to `/api/content/projects`. It's idempotent and only writes when the key is missing.
try:
    current_projects = _get_content('projects')
    # If missing or empty list/object, seed with sample PROJECTS
    if not current_projects:
        _set_content('projects', PROJECTS)
    # Ensure footerLinks exists so Footer tab isn't empty in admin
    if _get_content('footerLinks') is None:
        sample_footer = [
            {"id": 1, "provider": "github", "label": "GitHub", "url": "https://github.com/kuinkelarun"},
            {"id": 2, "provider": "linkedin", "label": "LinkedIn", "url": "https://linkedin.com/in/arun-kuinkel-47404999"}
        ]
        _set_content('footerLinks', sample_footer)
except Exception:
    # If DB isn't writable or something else goes wrong, don't crash the app on import
    pass


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

# Provide a favicon endpoint to avoid browsers requesting /favicon.ico from the API host
# When users visit the backend root, browsers may try to fetch /favicon.ico which
# previously returned 404. Redirect to the frontend favicon if a frontend URL is
# configured so the request succeeds and avoids noisy 404s in logs.
@app.get('/favicon.ico')
def favicon():
    try:
        if FRONTEND_URL:
            return redirect(f"{FRONTEND_URL.rstrip('/')}/favicon.svg")
    except Exception:
        pass
    # Fallback: return 204 No Content so browsers stop requesting repeatedly
    return ('', 204)


@app.get("/")
def index_root():
    """Landing for the backend service. Redirect to frontend if available."""
    try:
        if FRONTEND_URL:
            return redirect(FRONTEND_URL)
    except Exception:
        pass
    html = """
<!doctype html>
<html>
  <head><meta charset='utf-8'><title>Backend</title></head>
  <body style='font-family:system-ui,Segoe UI,Roboto,Arial;padding:24px'>
    <h1>Backend Service</h1>
    <p>This is the API backend for your personal portfolio.</p>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
      <li><a href="/api/projects">/api/projects</a></li>
      <li><a href="/api/content">/api/content</a></li>
    </ul>
  </body>
</html>
"""
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.get('/api/routes')
def list_routes():
    """Debug endpoint: list all registered Flask routes."""
    try:
        rules = sorted([str(rule) for rule in app.url_map.iter_rules()])
        return jsonify({'routes': rules})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.post('/api/admin/test-write')
def admin_test_write():
    """Admin-only test: attempt to write a sample message and return detailed errors if any."""
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    try:
        name = "__test__"
        email = "test@example.com"
        message = "Test write from admin_test_write"
        ip = request.remote_addr or "127.0.0.1"
        created_at = datetime.utcnow()
        if USE_DB_MODULE:
            mid = db_insert_message(name, email, message, ip, created_at)
            return jsonify({"success": True, "id": mid})
        else:
            with sqlite3.connect(DB_PATH) as conn:
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO messages (name, email, message, ip, created_at) VALUES (?, ?, ?, ?, ?)",
                    (name, email, message, ip, created_at),
                )
                conn.commit()
                return jsonify({"success": True, "id": cur.lastrowid})
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        return jsonify({"success": False, "error": str(e), "trace": tb}), 500


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
    created_at = datetime.utcnow()

    try:
        if USE_DB_MODULE:
            db_insert_message(name, email, message, ip, created_at)
        else:
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
        if USE_DB_MODULE:
            count = db_count_messages()
        else:
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
    # Use the module-level ADMIN_TOKEN (read from env at startup)
    admin_token = ADMIN_TOKEN
    # Header `X-ADMIN-TOKEN` or query param `admin_token`
    provided = request.headers.get("X-ADMIN-TOKEN") or request.args.get("admin_token")
    return provided and provided == admin_token


@app.get('/api/content')
def get_all_content():
    try:
        data = _get_all_content()
        return jsonify(data)
    except Exception:
        return jsonify({}), 500


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


# --- Admin export / DB download ---
@app.get('/api/admin/export')
def admin_export():
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    data = {}
    # Export content table
    # Export content and messages using DB module when available
    if USE_DB_MODULE:
        try:
            data['content'] = _get_all_content() or {}
        except Exception:
            data['content'] = {}
        try:
            data['messages'] = db_get_all_messages() or []
        except Exception:
            data['messages'] = []
    else:
        # Fallback to sqlite-based export
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cur = conn.cursor()
                cur.execute("SELECT key, value FROM content")
                rows = cur.fetchall()
            content = {}
            for k, v in rows:
                try:
                    content[k] = json.loads(v)
                except Exception:
                    content[k] = v
            data['content'] = content
        except Exception:
            data['content'] = {}

        try:
            with sqlite3.connect(DB_PATH) as conn:
                cur = conn.cursor()
                cur.execute("SELECT id, name, email, message, ip, created_at FROM messages")
                rows = cur.fetchall()
            messages = []
            for r in rows:
                messages.append({
                    'id': r[0], 'name': r[1], 'email': r[2], 'message': r[3], 'ip': r[4], 'created_at': r[5]
                })
            data['messages'] = messages
        except Exception:
            data['messages'] = []

    return jsonify(data)


@app.get('/api/admin/debug')
def admin_debug():
    """Admin-only debug: report DB backend and sample content for troubleshooting."""
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    try:
        info = {
            'use_db_module': bool(USE_DB_MODULE),
            'db_path': DB_PATH if 'DB_PATH' in globals() else None,
        }
        try:
            info['about'] = _get_content('about')
        except Exception as e:
            info['about_error'] = str(e)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.get('/api/admin/download-db')
def admin_download_db():
    # Return the raw SQLite DB file as an attachment (admin-only)
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    if USE_DB_MODULE:
        return jsonify({"error": "download not available for Postgres; use /api/admin/export"}), 400
    db_path = Path(DB_PATH)
    if not db_path.exists():
        return jsonify({"error": "db not found"}), 404
    # send_from_directory expects a directory and filename
    return send_from_directory(directory=str(db_path.parent or '.'), path=db_path.name, as_attachment=True)


if __name__ == "__main__":
    # For local debug only; in production use a WSGI server (gunicorn) or container
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
