import sqlite3
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path for Cloud Run vs local development
# Locally, it will be app/data/waiswallet.db (relative to project root, but absolute here)
# We go up two levels from 'initialize/' to 'app/data/' to find the DB.
# If K_SERVICE is set (Cloud Run), use /mnt/data
DB_PATH = "/mnt/data/waiswallet.db" if os.getenv("K_SERVICE") else os.path.abspath(os.path.join(BASE_DIR, "..", "waiswallet.db"))

def run_sql_file(cursor, file_path):
    """Helper to read and execute a SQL file."""
    # Resolve file_path relative to script location
    full_path = os.path.join(BASE_DIR, file_path)
    
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            cursor.executescript(f.read())
        print(f"✅ Executed {file_path}")
    else:
        print(f"⚠️ Warning: {full_path} not found.")

def init_db():
    print(f"🗄️ Initializing database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Step 1: Create Tables
    run_sql_file(cursor, '1_create_db.sql')
    
    # Step 2: Apply Triggers
    run_sql_file(cursor, '2_triggers_db.sql')

    # Step 3: Insert records in the tables
    run_sql_file(cursor, '3_insert_records.sql')
    
    conn.commit()
    conn.close()
    print("✨ Database initialization complete.")

if __name__ == "__main__":
    init_db()