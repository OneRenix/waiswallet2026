from dataclasses import dataclass
import sqlite3
import re
from pydantic_ai import RunContext

@dataclass
class PilotDeps:
    db: sqlite3.Connection
    system_rules: str  # Content of database.md (Now database_compact.md)

# ==========================================================
# RE-ACT TOOLS: These are the "hands" of the agent
# ==========================================================

async def get_wallet_balances(ctx: RunContext[PilotDeps]):
    """Queries the SQLite DB for current cash and debt balances."""
    query = "SELECT id, name, type, balance, available_credit FROM wallets"
    print(f"🔍 [Tool Call] get_wallet_balances | SQL: {query}")
    cursor = ctx.deps.db.cursor()
    cursor.execute(query)
    return [dict(row) for row in cursor.fetchall()]

async def check_goal_progress(ctx: RunContext[PilotDeps]):
    """Checks the status of Priority 1 savings goals."""
    query = "SELECT name, target_amount, current_amount FROM savings_goals WHERE priority_level = 1"
    print(f"🔍 [Tool Call] check_goal_progress | SQL: {query}")
    cursor = ctx.deps.db.cursor()
    cursor.execute(query)
    return [dict(row) for row in cursor.fetchall()]

async def optimize_payment_method(ctx: RunContext[PilotDeps], category_id: int):
    """
    Finds the best wallet for a purchase based on rewards and caps.
    Logic: Checks mapping in database.md against current cashback usage.
    """
    query = """
        SELECT w.id, w.name, w.type, w.balance, w.available_credit, 
               h.amount_earned, h.monthly_limit, h.is_capped
        FROM wallets w
        LEFT JOIN wallet_cashback_history h ON w.id = h.wallet_id 
             AND h.month_year = strftime('%Y-%m', 'now')
    """
    print(f"🔍 [Tool Call] optimize_payment_method | SQL: {query.strip()}")
    cursor = ctx.deps.db.cursor()
    cursor.execute(query)
    wallets = [dict(row) for row in cursor.fetchall()]
    return wallets

async def subscription_auditor(ctx: RunContext[PilotDeps]):
    """Checks for missing or double payments of recurring expenses."""
    query = """
        SELECT r.name, r.amount_estimate, r.frequency, 
               MAX(d.billing_date) as last_paid
        FROM recurring_expenses r
        LEFT JOIN transaction_details d ON r.category_id = d.category_id
        WHERE r.is_active = 1
        GROUP BY r.id
    """
    print(f"🔍 [Tool Call] subscription_auditor | SQL: {query.strip()}")
    cursor = ctx.deps.db.cursor()
    cursor.execute(query)
    return [dict(row) for row in cursor.fetchall()]

async def debt_repayment_engine(ctx: RunContext[PilotDeps]):
    """Analyzes income vs debt to suggest optimized payment amounts."""
    debt_query = "SELECT SUM(balance) as total_debt FROM wallets WHERE type = 'credit'"
    savings_query = "SELECT SUM(balance) as total_savings FROM wallets WHERE type = 'debit'"
    print(f"🔍 [Tool Call] debt_repayment_engine | SQLs: {debt_query}, {savings_query}")
    
    cursor = ctx.deps.db.cursor()
    cursor.execute(debt_query)
    debt_row = cursor.fetchone()
    debt = debt_row[0] if debt_row else 0
    
    cursor.execute(savings_query)
    savings_row = cursor.fetchone()
    savings = savings_row[0] if savings_row else 0
    
    return {
        "total_debt": debt or 0,
        "total_savings": savings or 0,
        "recommendation": "Pay 20% of smallest balance first" if (debt and debt > 0) else "All clear"
    }

async def credit_utilization_guard(ctx: RunContext[PilotDeps]):
    """Monitors credit cards to ensure they stay below 30% utilization."""
    query = """
        SELECT name, balance, credit_limit, 
               CASE WHEN credit_limit > 0 THEN (balance / credit_limit) * 100 ELSE 0 END as utilization
        FROM wallets 
        WHERE type = 'credit'
    """
    print(f"🔍 [Tool Call] credit_utilization_guard | SQL: {query.strip()}")
    cursor = ctx.deps.db.cursor()
    cursor.execute(query)
    return [dict(row) for row in cursor.fetchall()]

async def run_sql_query(ctx: RunContext[PilotDeps], query: str):
    """
    Executes a read-only SQL query against the SQLite database.
    Use this tool when no specific tool matches the user's request.
    
    IMPORTANT Safety Rules:
    1. Only SELECT statements are allowed.
    2. Do NOT modify data (NO INSERT, UPDATE, DELETE, DROP).
    """
    # Security check: Basic protection against destructive and system operations
    forbidden_keywords = [
        "DELETE", "DROP", "ALTER", "TRUNCATE", "REPLACE",
        "PRAGMA", "ATTACH", "DETACH", "COMMIT", "ROLLBACK", "VACUUM"
    ]
    normalized_query = query.strip().upper()
    
    if any(kw in normalized_query for kw in forbidden_keywords):
        print(f"⚠️ [Security Blocked] run_sql_query | SQL: {query}")
        return {"error": f"Security Alert: The keyword you used is not allowed for safety reasons."}
    
    # Enforce LIMIT 50 for safety and token efficiency
    if "LIMIT" not in normalized_query:
        query = query.rstrip(';') + " LIMIT 50"
    else:
        # Check if the existing limit is too high
        match = re.search(r'LIMIT\s+(\d+)', normalized_query)
        if match and int(match.group(1)) > 50:
            query = re.sub(r'LIMIT\s+\d+', 'LIMIT 50', query, flags=re.IGNORECASE)
        
    print(f"🔍 [Tool Call] run_sql_query | SQL: {query}")
    try:
        cursor = ctx.deps.db.cursor()
        
        # Fast Validation: Verify syntax and logic using EXPLAIN
        try:
            cursor.execute(f"EXPLAIN QUERY PLAN {query}")
        except sqlite3.Error as e:
            print(f"⚠️ [SQL Validation Failed] Query: {query} | Error: {e}")
            return {"error": f"SQL Validation Error: {str(e)}. Please check your table/column names and syntax."}

        # Actual Execution
        cursor.execute(query)
        rows = cursor.fetchall()
        
        # If no results
        if not rows:
            return {"message": "No results found for the query."}
            
        # Return list of dicts for the agent to analyze
        return [dict(row) for row in rows]
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}

async def get_table_schema(ctx: RunContext[PilotDeps], table_name: str):
    """
    Retrieves the detailed schema (columns, types, constraints) for a specific table.
    Use this BEFORE writing a SQL query to ensure your column names are correct.
    """
    # Security: basic name validation
    if not re.match(r'^\w+$', table_name):
        return {"error": "Invalid table name format."}
        
    print(f"🔍 [Tool Call] get_table_schema | Table: {table_name}")
    try:
        cursor = ctx.deps.db.cursor()
        
        # 1. Get column info
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = [dict(row) for row in cursor.fetchall()]
        
        if not columns:
            return {"error": f"Table '{table_name}' not found."}
            
        # 2. Get foreign key info
        cursor.execute(f"PRAGMA foreign_key_list({table_name});")
        fks = [dict(row) for row in cursor.fetchall()]
        
        return {
            "table": table_name,
            "columns": columns,
            "foreign_keys": fks
        }
    except Exception as e:
        return {"error": f"Error fetching schema: {str(e)}"}

async def get_recommendation_history(ctx: RunContext[PilotDeps]):
    """
    Retrieves the history of strategic recommendations and their current statuses.
    Use this to avoid repeating recommendations that the user has already dismissed, snoozed, or completed.
    Note: Statuses are 'pending', 'dismissed', 'completed' (acted_upon).
    If a recommendation was dismissed > 30 days ago, it may be re-evaluated for financial health.
    """
    query = "SELECT title, message, status, urgency_level, created_at, updated_at FROM strategic_recommendations ORDER BY created_at DESC LIMIT 15"
    print(f"🔍 [Tool Call] get_recommendation_history")
    try:
        cursor = ctx.deps.db.cursor()
        cursor.execute(query)
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        return {"error": f"Error fetching history: {str(e)}"}