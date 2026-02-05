import os
import sys

# Ensure we can import from app
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(project_root)

from app.db.connection import get_db_connection, get_db_session

def test_context_manager():
    print("🧪 Testing get_db_connection (context manager)...")
    try:
        with get_db_connection() as conn:
            res = conn.execute("SELECT name FROM wallets LIMIT 1;").fetchone()
            print(f"✅ Success! Found wallet: {res['name'] if res else 'None'}")
    except Exception as e:
        print(f"❌ Failed: {e}")

def test_generator():
    print("\n🧪 Testing get_db_session (generator)...")
    try:
        gen = get_db_session()
        conn = next(gen)
        res = conn.execute("SELECT name FROM wallets LIMIT 1;").fetchone()
        print(f"✅ Success! Found wallet: {res['name'] if res else 'None'}")
        # Clean up
        try:
            next(gen)
        except StopIteration:
            pass
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    test_context_manager()
    test_generator()
