import os
import sqlite3
from datetime import datetime
from flask import Flask, jsonify, request
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
    # Development fallback
    cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

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


if __name__ == "__main__":
    # For local debug only; in Render use gunicorn app:app
    app.run(host="0.0.0.0", port=5000, debug=True)
