import sqlite3
import re
import os
import sys
from connection import get_db_connection

def parse_database_md():
    """Parses database.md to extract table and column names."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    md_path = os.path.join(project_root, "app/data/database.md")
    
    if not os.path.exists(md_path):
        print(f"❌ Error: database.md not found at {md_path}")
        return {}

    with open(md_path, "r") as f:
        content = f.read()

    # Regex to find tables and their columns
    # Looking for "### Table X: `table_name`" and then bullet points with "`column_name`"
    tables = {}
    table_sections = re.split(r'### Table \d+: `', content)[1:]
    
    for section in table_sections:
        lines = section.split('\n')
        table_name = lines[0].split('`')[0].strip()
        
        # Extract columns: lines starting with * **`column_name`**
        columns = re.findall(r'\* \*\*`(\w+)`\*\*', section)
        tables[table_name] = columns

    return tables

def verify_schema():
    """Compares database.md content with actual database schema."""
    expected_tables = parse_database_md()
    if not expected_tables:
        return

    print("🔍 Starting Schema Verification...")
    print("-" * 40)
    
    errors = 0
    with get_db_connection(readonly=True) as conn:
        cursor = conn.cursor()
        
        # Get actual tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        actual_tables = [row['name'] for row in cursor.fetchall()]
        
        for table_name, expected_cols in expected_tables.items():
            if table_name not in actual_tables:
                print(f"❌ Missing Table: '{table_name}' exists in database.md but not in DB.")
                errors += 1
                continue
            
            # Get actual columns for this table
            cursor.execute(f"PRAGMA table_info({table_name});")
            actual_cols = [row['name'] for row in cursor.fetchall()]
            
            for col in expected_cols:
                if col not in actual_cols:
                    print(f"❌ Missing Column: '{col}' in table '{table_name}' exists in database.md but not in DB.")
                    errors += 1
            
            # Check for undocumented columns (optional, but helpful)
            for col in actual_cols:
                if col not in expected_cols:
                    print(f"⚠️  Undocumented Column: '{col}' in table '{table_name}' exists in DB but not in database.md.")

    print("-" * 40)
    if errors == 0:
        print("✅ Verification Success: database.md is in sync with the database.")
    else:
        print(f"❌ Verification Failed: Found {errors} discrepancies.")
        sys.exit(1)

if __name__ == "__main__":
    verify_schema()
