# Backend utilities

This folder contains server code for the portfolio backend. A few utility files and debug endpoints are intentionally separated or gated:

- `scripts/migrate_to_postgres.py`: Migration and import tool. Use this to create `content` and `messages` tables on a Postgres database and optionally import an export JSON produced by `/api/admin/export`.

- `ENABLE_ADMIN_DEBUG` env var: For safety, admin/debug endpoints are disabled by default. Set `ENABLE_ADMIN_DEBUG=1` (or `true`) in your environment to enable admin-only endpoints such as `/api/admin/export`, `/api/admin/test-write`, `/api/admin/db-reload`, etc. These endpoints still require a valid JWT bearer token.

---

## Admin authentication

The admin panel uses email + password sign-in. Credentials are stored as environment variables — never in code.

### Required environment variables

| Variable | Description |
|---|---|
| `ADMIN_EMAIL` | The email address used to sign in to the admin panel |
| `ADMIN_PASSWORD_HASH` | A hashed version of your password (generated locally, see below) |
| `SECRET_KEY` | A long random string used to sign JWT tokens |

### Generating a password hash

You must hash your password locally before storing it. Run this command in the `backend/` directory:

```bash
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('your-password-here'))"
```

Copy the output (starting with `scrypt:...`) and paste it as the value of `ADMIN_PASSWORD_HASH` in your hosting platform's environment variables.

> **Never paste your plain text password as the env var value.** Only the hash goes there.

### Setting credentials on Railway

1. Go to your Railway project → select the backend service → **Variables** tab
2. Add/update these three variables:
   - `ADMIN_EMAIL` = your email (e.g. `you@example.com`)
   - `ADMIN_PASSWORD_HASH` = the `scrypt:...` hash from the command above
   - `SECRET_KEY` = a strong random string (32+ characters)
3. Railway will automatically redeploy with the new values

### Changing your password

To change your password at any time:

1. Run the hash generation command above with your **new** password
2. Copy the new `scrypt:...` hash
3. Update `ADMIN_PASSWORD_HASH` in your Railway (or Vercel/Render) environment variables
4. Redeploy — your new password is now active

> When you sign in, always use the **plain text** password. The hash is only used during setup.

### Local development

For local dev, credentials are stored in `backend/.env` (gitignored). The `.env` file looks like:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=scrypt:32768:8:1$...  # hash of your dev password
SECRET_KEY=any-local-dev-secret
```

Generate a local hash the same way as above and paste it into `.env`.

Usage examples:

- Run the migration/import script (replace `DATABASE_URL` with your Railway DB URL or set the env var):

```bash
python backend/scripts/migrate_to_postgres.py --db "<DATABASE_URL>" --import export.json
```

- Enable admin debug endpoints on a running deployment (Railway env var):

Set `ENABLE_ADMIN_DEBUG=1` in Railway environment variables and redeploy. Be sure to rotate `ADMIN_TOKEN` if these were exposed publicly during testing.

