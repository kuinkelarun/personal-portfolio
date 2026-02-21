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

limiter = Limiter(get_remote_address, app=app, default_limits=[], storage="memory://")


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
    # Try non-package import for different run contexts
    try:
        from db import init_db as db_init, _get_content as db_get_content, _set_content as db_set_content, get_all_content as db_get_all_content, get_all_messages as db_get_all_messages, insert_message as db_insert_message, count_messages as db_count_messages, DB_PATH as DB_PATH
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
    # Fallback to original sqlite helpers
    def _db_path_from_url(url: str) -> str:
        if url.startswith("sqlite:///"):
            return url.replace('sqlite:///', '')
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
        "title": "E-Commerce Platform",
        "description": "A full-stack e-commerce application with user authentication, product catalog, shopping cart, and payment integration. Built with modern web technologies and optimized for performance.",
        "tags": ["Python", "Pandas", "scikit-learn", "ML"],
        "links": {
            "github": "https://github.com/yourusername/project-1",
            "demo": "https://demo.example.com"
        }
    },
    {
        "id": 2,
        "title": "Task Management App",
        "description": "A collaborative task management tool with real-time updates, project boards, and team collaboration features. Includes drag-and-drop functionality and notifications.",
        "tags": ["React", "Firebase", "Material-UI"],
        "links": {
            "github": "https://family-tree-crm.web.app/",
            "demo": "https://your-calendar.example.com"
        }
    },
    {
        "id": 3,
        "title": "Weather Dashboard",
        "description": "A responsive weather application that displays current conditions and forecasts using external APIs. Features location search, favorites, and detailed weather metrics.",
        "tags": ["JavaScript", "API", "Chart.js"],
        "links": {
            "github": "https://github.com/yourusername/project-3",
            "demo": "https://demo.example.com"
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
            {"id": 1, "provider": "github", "label": "GitHub", "url": "https://github.com/yourusername"},
            {"id": 2, "provider": "linkedin", "label": "LinkedIn", "url": "https://linkedin.com/in/yourprofile"}
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
            try:
                mid = db_insert_message(name, email, message, ip, created_at)
            except NameError:
                # Fallback: import the db module at runtime and call insert_message
                try:
                    import importlib
                    dbmod = importlib.import_module('db')
                    mid = dbmod.insert_message(name, email, message, ip, created_at)
                except Exception:
                    raise
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


@app.get('/api/admin/db-info')
def admin_db_info():
    """Admin-only: report DB host/port/name and column defaults for `messages` table."""
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    try:
        import importlib
        dbmod = importlib.import_module('db')
        info = {}
        try:
            url = dbmod.engine.url
            info['host'] = getattr(url, 'host', None)
            info['port'] = getattr(url, 'port', None)
            info['database'] = getattr(url, 'database', None)
            info['username'] = getattr(url, 'username', None)
        except Exception as e:
            info['url_error'] = str(e)

        # Query information_schema for messages table columns
        try:
            from sqlalchemy import text
            cols = []
            with dbmod.engine.connect() as conn:
                res = conn.execute(text("""
                    SELECT column_name, column_default, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'messages'
                    ORDER BY ordinal_position
                """))
                for row in res:
                    cols.append({'column': row[0], 'default': row[1], 'is_nullable': row[2]})
            info['messages_columns'] = cols
        except Exception as e:
            info['messages_columns_error'] = str(e)

        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.get('/api/admin/db-schema')
def admin_db_schema():
    """Admin-only: show current search_path, current_schema and list messages table columns per schema."""
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    try:
        import importlib
        dbmod = importlib.import_module('db')
        info = {}
        try:
            with dbmod.engine.connect() as conn:
                # current schema and search_path
                # use exec_driver_sql for plain SQL in SQLAlchemy 2.x
                res = conn.exec_driver_sql("SELECT current_schema(), current_setting('search_path')")
                row = res.fetchone()
                info['current_schema'] = row[0]
                info['search_path'] = row[1]

                # list all schemas that have a messages table and their column defaults
                from sqlalchemy import text
                q = text("""
                    SELECT table_schema, column_name, column_default, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'messages'
                    ORDER BY table_schema, ordinal_position
                """)
                cols = []
                res2 = conn.execute(q)
                for r in res2:
                    cols.append({'schema': r[0], 'column': r[1], 'default': r[2], 'is_nullable': r[3]})
                info['messages_columns_by_schema'] = cols
        except Exception as e:
            info['error'] = str(e)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.post('/api/admin/db-reload')
def admin_db_reload():
    """Admin-only: dispose SQLAlchemy engine pools so new connections pick up schema changes."""
    if not _is_admin(request):
        return jsonify({"error": "unauthorized"}), 401
    try:
        import importlib
        dbmod = importlib.import_module('db')
        try:
            # Dispose engine pools
            dbmod.engine.dispose()
            # Optionally ensure tables exist
            try:
                dbmod.init_db()
            except Exception:
                pass
            return jsonify({"success": True, "message": "engine disposed"})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.get('/api/projects')
def get_projects():
    # Prefer projects stored in content table so admin edits are reflected.
    val = _get_content('projects')
    if isinstance(val, list):
        return jsonify(val)
    return jsonify(PROJECTS)

... (file continues)
