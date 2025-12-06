import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime
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


def init_db():
    """Create tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


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
        rows = session.query(Message).all()
        result = []
        for r in rows:
            result.append({
                'id': r.id,
                'name': r.name,
                'email': r.email,
                'message': r.message,
                'ip': r.ip,
                'created_at': r.created_at.isoformat() if r.created_at else None
            })
        return result


def insert_message(name, email, message, ip, created_at):
    with SessionLocal() as session:
        m = Message(name=name, email=email, message=message, ip=ip, created_at=created_at)
        session.add(m)
        session.commit()
        return m.id


def count_messages():
    with SessionLocal() as session:
        return session.query(Message).count()


# DB_PATH: used by the app to choose upload folder location.
if DATABASE_URL.startswith('sqlite:///'):
    DB_PATH = DATABASE_URL.replace('sqlite:///', '')
else:
    DB_PATH = os.path.join(os.getcwd(), 'messages.db')
