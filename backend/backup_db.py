import os
import shutil
from datetime import datetime
from pathlib import Path

# Optional S3 upload (requires boto3 and AWS env vars)
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    BOTO3_AVAILABLE = True
except Exception:
    BOTO3_AVAILABLE = False

DB_ENV = os.getenv('DATABASE_URL', 'sqlite:///messages.db')


def _db_path_from_url(url: str) -> str:
    if url.startswith('sqlite:///'):
        return url.replace('sqlite:///', '')
    return 'messages.db'


DB_PATH = Path(_db_path_from_url(DB_ENV))
BACKUP_DIR = Path(os.getenv('DB_BACKUP_DIR', 'backups'))


def make_local_backup():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    if not DB_PATH.exists():
        print(f"DB path not found: {DB_PATH}")
        return None
    ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
    dest = BACKUP_DIR / f"messages-{ts}.db"
    shutil.copy2(DB_PATH, dest)
    print(f"Local backup created: {dest}")
    return dest


def upload_to_s3(file_path: Path):
    if not BOTO3_AVAILABLE:
        print('boto3 not available; skipping S3 upload')
        return False
    bucket = os.getenv('AWS_S3_BUCKET')
    if not bucket:
        print('AWS_S3_BUCKET not set; skipping S3 upload')
        return False
    s3_key = f"backups/{file_path.name}"
    s3 = boto3.client('s3')
    try:
        s3.upload_file(str(file_path), bucket, s3_key)
        print(f"Uploaded {file_path} to s3://{bucket}/{s3_key}")
        return True
    except (BotoCoreError, ClientError) as e:
        print(f"S3 upload failed: {e}")
        return False


if __name__ == '__main__':
    # Create a local backup and optionally upload to S3
    backup = make_local_backup()
    if backup and os.getenv('AWS_S3_BUCKET'):
        upload_to_s3(backup)
    elif backup:
        print('No S3 bucket configured — backup saved locally.')
