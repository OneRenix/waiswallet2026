from dataclasses import dataclass
from pydantic import BaseModel
from pydantic_ai import RunContext
from sqlite3 import Connection
import re
from tenacity import retry, stop_after_attempt, wait_exponential
import sqlite3
from ..core.logger import logger, log_tool_call, log_security_block, log_error
from ..core.exceptions import DatabaseError, ValidationError, ToolExecutionError

@dataclass
class PilotDeps:
    db: sqlite3.Connection
    system_rules: str  # Content of database_compact.md
    is_new_session: bool = False

# ==========================================================
# RE-ACT TOOLS: These are the "hands" of the agent
# ==========================================================

async def run_sql_query(ctx: RunContext[PilotDeps], query: str):
    """
    Execute a SQLite SELECT query to fetch financial data.
    
    COLUMNS MAPPING (CRITICAL):
    - Table 'wallets': Use 'name' (NOT 'wallet_name') and 'type' (NOT 'wallet_type').
    - Table 'transaction_headers': Use 'wallet_id', 'merchant', 'total_amount'.
    
    RULES:
    - Read-only (SELECT). No INSERT/UPDATE/DELETE.
    - Max 50 rows returned.
    """
    db = ctx.deps.db
    
    # 1. Security: Strict Write-Blocking
    forbidden = r'\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b'
    if re.search(forbidden, query, re.IGNORECASE):
        # Using raise here as it's a security violation
        # We need to make sure ValidationError is handled by the caller or we return a dict
        # The user's prompt showed `raise ValidationError`, but the previous code returned a dict for `except Exception`
        # To be safe and consistent with the user's request, I will return a dict error for security too, 
        # as raising an exception might crash the agent if not caught by PydanticAI's tool handler (which it usually is, but dict is safer for the agent to see).
        # WAIT, the user code explicitly said: `raise ValidationError("SQL write operations are forbidden. Use dedicated tools.")`
        # I will respect the user's code.
        raise ValidationError("SQL write operations are forbidden. Use dedicated tools.")
    
    # 2. Token Efficiency: Force LIMIT 50
    normalized_query = query.strip().upper()
    if "LIMIT" not in normalized_query:
        query = query.rstrip(';') + " LIMIT 50"
    
    try:
        # 3. Validation: Explain before Execute
        db.execute(f"EXPLAIN QUERY PLAN {query}")
        
        # 4. Execution
        cursor = db.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows] if rows else [{"message": "No data found."}]
        
    except Exception as e:
        # 5. Smart Error Handling: Guides the agent back to the schema
        error_msg = str(e).lower()
        if "no such column" in error_msg:
            return [{"error": f"{str(e)}", "tip": "Use 'name' for wallet names, not 'wallet_name'."}]
        return [{"error": f"Query failed: {str(e)}"}]

async def get_table_schema(ctx: RunContext[PilotDeps], table_name: str):
    """Fetch table schema (cols/types). Only use if not in prompt."""
    if not re.match(r'^\w+$', table_name):
        return {"error": "Invalid table name format."}
        
    log_tool_call("get_table_schema", table_name=table_name)
    try:
        cursor = ctx.deps.db.cursor()
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = [dict(row) for row in cursor.fetchall()]
        
        if not columns:
            return {"error": f"Table '{table_name}' not found."}
            
        cursor.execute(f"PRAGMA foreign_key_list({table_name});")
        fks = [dict(row) for row in cursor.fetchall()]
        
        return {
            "table": table_name,
            "columns": columns,
            "foreign_keys": fks
        }
    except Exception as e:
        return {"error": f"Error fetching schema: {str(e)}"}

from app.utils.wallet_benefits import get_cashback_rate

async def add_transaction(ctx: RunContext[PilotDeps], wallet_id: int, total_amount: float, category_id: int, merchant: str, description: str = "", date: str = None):
    """Record a purchase. IDs must be looked up via SQL first if unknown."""
    log_tool_call("add_transaction", wallet_id=wallet_id, amount=total_amount)
    
    if date is None:
        from datetime import date as dt
        date = dt.today().isoformat()
        
    try:
        db = ctx.deps.db
        cursor = db.cursor()
        
        # 1. Insert Header
        cursor.execute("""
            INSERT INTO transaction_headers (wallet_id, merchant, total_amount, transaction_date, payment_type, description, executed_by)
            VALUES (?, ?, ?, ?, 'straight', ?, 'ai')
        """, (wallet_id, merchant, total_amount, date, description))
        header_id = cursor.lastrowid
        
        # 2. Calculate Cashback
        # Note: We need to adapt get_cashback_rate to work with cursor or connection if it expects a specific type
        # But get_cashback_rate expects a connection, and ctx.deps.db is a connection.
        cashback_rate = get_cashback_rate(db, wallet_id, category_id)
        cashback_earned = total_amount * (cashback_rate / 100.0)
        
        # 3. Insert Detail
        cursor.execute("""
            INSERT INTO transaction_details (header_id, category_id, line_amount, billing_date, cashback_earned)
            VALUES (?, ?, ?, ?, ?)
        """, (header_id, category_id, total_amount, date, cashback_earned))
        
        db.commit()
        return {"status": "success", "transaction_id": header_id, "message": f"Transaction recorded. Earned {cashback_earned} cashback."}
        
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to add transaction: {str(e)}"}

async def add_recommendation(ctx: RunContext[PilotDeps], title: str, message: str, urgency: str = "medium"):
    """Save financial advice/warnings to dashboard. Urgency: low|med|high|critical."""
    log_tool_call("add_recommendation", title=title)
    try:
        db = ctx.deps.db
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO strategic_recommendations (title, message, urgency_level, status)
            VALUES (?, ?, ?, 'pending')
        """, (title, message, urgency))
        
        db.commit()
        return {"status": "success", "message": "Recommendation saved to dashboard."}
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to save recommendation: {str(e)}"}