import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import JSON as SA_JSON
from sqlalchemy.dialects.postgresql import JSONB

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///messages.db')

# Create engine and session
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

# Choose JSON type: prefer JSONB for Postgres
try:
    JSON_TYPE = JSONB if engine.dialect.name == 'postgresql' else SA_JSON
except Exception:
    JSON_TYPE = SA_JSON


class Content(Base):
    __tablename__ = 'content'
    key = Column(String, primary_key=True)
    value = Column(JSON_TYPE, nullable=False)


class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    ip = Column(String)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    read = Column(Integer, nullable=False, default=0)  # 0=unread, 1=read (compatible with SQLite)


def init_db():
    """Create tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
    
    # Migration: Add 'read' column to messages table if it doesn't exist
    try:
        with SessionLocal() as session:
            # Try to query a message with read column
            session.execute(text("SELECT read FROM messages LIMIT 1"))
    except Exception:
        # Column doesn't exist, add it
        try:
            with SessionLocal() as session:
                if engine.dialect.name == 'postgresql':
                    session.execute(text("ALTER TABLE messages ADD COLUMN read INTEGER DEFAULT 0 NOT NULL"))
                elif engine.dialect.name == 'sqlite':
                    session.execute(text("ALTER TABLE messages ADD COLUMN read INTEGER DEFAULT 0"))
                session.commit()
                print("✓ Added 'read' column to messages table")
        except Exception as e:
            print(f"Note: Could not add 'read' column (may already exist): {e}")


def _get_content(key: str):
    with SessionLocal() as session:
        obj = session.get(Content, key)
        if not obj:
            return None
        return obj.value


def _set_content(key: str, value):
    with SessionLocal() as session:
        obj = session.get(Content, key)
        if obj:
            obj.value = value
        else:
            obj = Content(key=key, value=value)
            session.add(obj)
        session.commit()


def get_all_content():
    with SessionLocal() as session:
        rows = session.query(Content).all()
        return {r.key: r.value for r in rows}


def get_all_messages():
    with SessionLocal() as session:
        try:
            rows = session.query(Message).order_by(Message.created_at.desc()).all()
            result = []
            for r in rows:
                result.append({
                    'id': r.id,
                    'name': r.name,
                    'email': r.email,
                    'message': r.message,
                    'ip': r.ip,
                    'created_at': r.created_at.isoformat() if r.created_at else None,
                    'read': bool(r.read) if hasattr(r, 'read') else False
                })
            return result
        except Exception as e:
            # If there's an error (e.g., column doesn't exist), try without read column
            print(f"Error fetching messages with read column: {e}")
            rows = session.execute(text("SELECT id, name, email, message, ip, created_at FROM messages ORDER BY created_at DESC")).fetchall()
            result = []
            for r in rows:
                result.append({
                    'id': r[0],
                    'name': r[1],
                    'email': r[2],
                    'message': r[3],
                    'ip': r[4],
                    'created_at': r[5],
                    'read': False
                })
            return result


def insert_message(name, email, message, ip, created_at):
    with SessionLocal() as session:
        m = Message(name=name, email=email, message=message, ip=ip, created_at=created_at, read=0)
        session.add(m)
        session.commit()
        return m.id


def count_messages():
    with SessionLocal() as session:
        return session.query(Message).count()


def delete_message(message_id):
    """Delete a single message by ID. Returns True if deleted, False if not found."""
    with SessionLocal() as session:
        msg = session.query(Message).filter(Message.id == message_id).first()
        if msg:
            session.delete(msg)
            session.commit()
            return True
        return False


def delete_messages(message_ids):
    """Delete multiple messages by IDs. Returns count of deleted messages."""
    with SessionLocal() as session:
        count = session.query(Message).filter(Message.id.in_(message_ids)).delete(synchronize_session=False)
        session.commit()
        return count


def mark_message_read(message_id, is_read=True):
    """Mark a message as read or unread. Returns True if updated, False if not found."""
    with SessionLocal() as session:
        msg = session.query(Message).filter(Message.id == message_id).first()
        if msg:
            msg.read = 1 if is_read else 0
            session.commit()
            return True
        return False


def mark_messages_read(message_ids, is_read=True):
    """Mark multiple messages as read or unread. Returns count of updated messages."""
    with SessionLocal() as session:
        count = session.query(Message).filter(Message.id.in_(message_ids)).update(
            {Message.read: 1 if is_read else 0},
            synchronize_session=False
        )
        session.commit()
        return count


# DB_PATH: used by the app to choose upload folder location.
if DATABASE_URL.startswith('sqlite:///'):
    DB_PATH = DATABASE_URL.replace('sqlite:///', '')
else:
    DB_PATH = os.path.join(os.getcwd(), 'messages.db')
