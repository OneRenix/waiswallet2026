import sqlite3
import os
from contextlib import contextmanager
from dotenv import load_dotenv

# Load .env.local
# Load .env.local
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
load_dotenv(os.path.join(project_root, ".env.local"))

def _get_db_logic(readonly=False):
    """
    Core logic for determining DB path and connecting.
    """
    # 1. Determine DB Path
    if os.getenv("K_SERVICE"):
        db_path = "/mnt/data/waiswallet.db"
    else:
        env_db_path = os.getenv("DATABASE_PATH", "app/data/waiswallet.db")
        if os.path.isabs(env_db_path):
            db_path = env_db_path
        else:
            db_path = os.path.abspath(os.path.join(project_root, env_db_path))

    # 2. Connect
    if readonly:
        # Use URI mode for read-only access
        db_uri = f"file:{db_path}?mode=ro"
        conn = sqlite3.connect(db_uri, uri=True, check_same_thread=False)
    else:
        conn = sqlite3.connect(db_path, check_same_thread=False)
        
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn, db_path

def get_db_session():
    """
    FastAPI-friendly generator for dependency injection (Read-Write).
    """
    conn, _ = _get_db_logic(readonly=False)
    try:
        yield conn
    finally:
        conn.close()

def get_readonly_db_session():
    """
    FastAPI-friendly generator for dependency injection (Read-Only).
    Use this for AI agent tools to prevent accidental/malicious data modification.
    """
    conn, _ = _get_db_logic(readonly=True)
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def get_db_connection(readonly=False):
    """
    Thread-safe connection context manager for standalone scripts.
    Usage: with get_db_connection() as conn:
    """
    conn, _ = _get_db_logic(readonly=readonly)
    try:
        yield conn
    finally:
        conn.close()