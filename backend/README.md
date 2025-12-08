# Backend utilities

This folder contains server code for the portfolio backend. A few utility files and debug endpoints are intentionally separated or gated:

- `scripts/migrate_to_postgres.py`: Migration and import tool. Use this to create `content` and `messages` tables on a Postgres database and optionally import an export JSON produced by `/api/admin/export`.

- `ENABLE_ADMIN_DEBUG` env var: For safety, admin/debug endpoints are disabled by default. Set `ENABLE_ADMIN_DEBUG=1` (or `true`) in your environment to enable admin-only endpoints such as `/api/admin/export`, `/api/admin/test-write`, `/api/admin/db-reload`, etc. These endpoints still require `ADMIN_TOKEN` to be set and provided on requests.

Usage examples:

- Run the migration/import script (replace `DATABASE_URL` with your Railway DB URL or set the env var):

```bash
python backend/scripts/migrate_to_postgres.py --db "<DATABASE_URL>" --import export.json
```

- Enable admin debug endpoints on a running deployment (Railway env var):

Set `ENABLE_ADMIN_DEBUG=1` in Railway environment variables and redeploy. Be sure to rotate `ADMIN_TOKEN` if these were exposed publicly during testing.

