#!/usr/bin/env python3
"""
Create Postgres tables for this portfolio app and optionally import data
from an export JSON produced by the backend `/api/admin/export` endpoint.

Usage:
  # set DATABASE_URL environment variable (from Railway) then:
  python migrate_to_postgres.py --import export.json

Or provide the DB URL directly:
  python migrate_to_postgres.py --db "postgres://..." --import export.json

This script will create two tables:
  - content(key TEXT PRIMARY KEY, value JSONB NOT NULL)
  - messages(id SERIAL PRIMARY KEY, name TEXT, email TEXT, message TEXT, ip TEXT, created_at TIMESTAMPTZ)

It will upsert content keys and insert messages (skipping duplicates by id).
"""
import os
import sys
import json
import argparse
import psycopg2
import psycopg2.extras


def create_tables(conn):
    cur = conn.cursor()
    # content table with jsonb values
    cur.execute("""
    CREATE TABLE IF NOT EXISTS content (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
    );
    """)

    # messages table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        ip TEXT,
        created_at TIMESTAMPTZ NOT NULL
    );
    """)

    # optional index to speed up searches on created_at
    cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);")
    conn.commit()
    cur.close()


def import_export(conn, export_path):
    with open(export_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    cur = conn.cursor()

    # Upsert content keys into content (jsonb)
    content = data.get('content', {})
    for k, v in content.items():
        cur.execute(
            "INSERT INTO content (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            (k, json.dumps(v))
        )

    # Insert messages (if messages exist)
    for m in data.get('messages', []):
        # ensure all fields exist
        mid = m.get('id')
        name = m.get('name') or ''
        email = m.get('email') or ''
        message = m.get('message') or ''
        ip = m.get('ip')
        created_at = m.get('created_at')

        # If created_at is not timezone-aware, Postgres will accept it as timestamptz
        try:
            cur.execute(
                "INSERT INTO messages (id, name, email, message, ip, created_at) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
                (mid, name, email, message, ip, created_at)
            )
        except Exception as e:
            print('Warning: failed to insert message id', mid, 'error:', e)

    conn.commit()
    cur.close()
    print('Import completed.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', help='Postgres DATABASE_URL (overrides $DATABASE_URL)')
    parser.add_argument('--import', dest='import_file', help='Path to export.json to import', default=None)
    args = parser.parse_args()

    db_url = args.db or os.environ.get('DATABASE_URL')
    if not db_url:
        print('Error: Provide a Postgres DATABASE_URL via --db or the DATABASE_URL env var')
        sys.exit(1)

    # Connect using sslmode=require for common cloud Postgres providers
    conn = psycopg2.connect(db_url, sslmode='require')

    create_tables(conn)
    print('Tables created or verified.')

    if args.import_file:
        if not os.path.exists(args.import_file):
            print('Import file not found:', args.import_file)
            sys.exit(1)
        import_export(conn, args.import_file)

    conn.close()


if __name__ == '__main__':
    main()
