"""
RailSync AI — Database Connection & Session Management
Provides thread-safe SQLite / PostgreSQL session factory and database initialization.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.models.db_models import Base

import os
import shutil

ROOT_DIR = Path(__file__).resolve().parents[2]

# On Vercel / serverless runtime, write SQLite database to /tmp
is_serverless = os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or not os.access(str(ROOT_DIR), os.W_OK)
if is_serverless:
    DATABASE_DIR = Path("/tmp/railsync_data")
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH = DATABASE_DIR / "railsync.db"
    
    # Pre-copy seeded database if available
    source_db = ROOT_DIR / "data" / "railsync.db"
    if source_db.exists() and not DATABASE_PATH.exists():
        try:
            shutil.copy2(source_db, DATABASE_PATH)
        except Exception:
            pass
else:
    DATABASE_DIR = ROOT_DIR / "data"
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH = DATABASE_DIR / "railsync.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables in the SQLite database."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency generator for FastAPI endpoints."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
