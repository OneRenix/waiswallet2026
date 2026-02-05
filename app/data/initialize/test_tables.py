import pandas as pd
import sys
import os

# Ensure we can import from app
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "../../.."))
sys.path.append(project_root)

from app.db.connection import get_db_connection

def main():
    print("🔍 Starting Database Verification using app.db.connection...")
    print(f"📂 Project Root: {project_root}")

    try:
        # Using the context manager from connection.py
        with get_db_connection() as conn:
            print("✅ Connection Successful via get_db_connection!")
            
            # Generic SQL executor
            def execute_sql(sql):
                try:
                    df = pd.read_sql_query(sql, conn)
                    print(f"\n📊 Query Results:")
                    print(f"SQL: {sql.strip()}")
                    if not df.empty:
                        print(df.to_string(index=False))
                    else:
                        print("(Empty Result Set)")
                except Exception as e:
                    print(f"⚠️ Query Failed: {e}")

            execute_sql("""
            SELECT c.label, SUM(td.line_amount) AS total_spent 
            FROM transaction_details td JOIN transaction_headers th 
            ON td.header_id = th.id JOIN categories c ON td.category_id = c.id WHERE STRFTIME('%Y-%m', td.billing_date) = STRFTIME('%Y-%m', 'now') 
            GROUP BY c.label ORDER BY total_spent DESC LIMIT 3;
            """)
            
            # 2. Show Complex Join
            # print("\n--- Transaction Details (Last 5) ---")
            # join_query = """
            # SELECT 
            #     h.transaction_date, 
            #     h.merchant, 
            #     h.total_amount as header_total,
            #     d.description,
            #     d.line_amount,
            #     d.category_id,
            #     h.executed_by
            # FROM transaction_headers h
            # JOIN transaction_details d ON h.id = d.header_id
            # ORDER BY h.transaction_date DESC
            # LIMIT 5
            # """
            # execute_sql(join_query)

        print("\n✨ Verification Complete.")
        
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    main()
