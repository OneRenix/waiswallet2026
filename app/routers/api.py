from fastapi import APIRouter, Depends, HTTPException
from sqlite3 import Connection
from typing import List, Optional, Dict
from pydantic import BaseModel
from ..db.connection import get_db_session
from ..utils.wallet_benefits import get_cashback_rate, save_wallet_benefits, get_wallet_benefits

router = APIRouter(prefix="/api", tags=["WaisWallet API"])

# --- Models ---
class WalletBase(BaseModel):
    name: str
    provider_id: int
    type: str
    balance: float
    credit_limit: Optional[float] = None
    cycle_day: Optional[int] = None
    due_day: Optional[int] = None
    monthly_cashback_limit: Optional[float] = None
    benefits: Optional[Dict[int, float]] = None  # category_id -> rate mapping
    color: str = '#3b82f6'

class TransactionBase(BaseModel):
    wallet_id: int
    merchant: str
    total_amount: float
    transaction_date: str
    category_id: int
    payment_type: str = "straight"
    description: Optional[str] = None

class GoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: float
    color: Optional[str] = None
    icon: Optional[str] = None
    source_id: Optional[int] = None

class RecommendationUpdate(BaseModel):
    status: str

# --- Endpoints ---

@router.get("/state")
async def get_app_state(db: Connection = Depends(get_db_session)):
    try:
        # 1. Fetch Categories
        categories = [dict(row) for row in db.execute("SELECT * FROM categories").fetchall()]
        
        # 2. Fetch Wallets with Provider info
        wallets_rows = db.execute("""
            SELECT w.*, p.name as provider_name, p.logo_url 
            FROM wallets w
            LEFT JOIN providers p ON w.provider_id = p.id
        """).fetchall()
        
        wallets = []
        for row in wallets_rows:
            w = dict(row)
            # Fetch benefits from new table
            w['benefits'] = get_wallet_benefits(db, w['id'])
            # Add 'provider' field for frontend compatibility
            if not w.get('provider'):
                 w['provider'] = w.get('provider_name', 'Unknown')
            wallets.append(w)
        
        # 2b. Calculate dynamic balances based on wallet type
        # For credit cards: sum of transaction_details.line_amount
        # For debit/cash: sum of income_transactions.amount
        
        # Get credit card balances (sum of expenses)
        credit_balances = {}
        credit_rows = db.execute("""
            SELECT w.id, COALESCE(SUM(td.line_amount), 0) as total_spent
            FROM wallets w
            LEFT JOIN transaction_headers th ON w.id = th.wallet_id
            LEFT JOIN transaction_details td ON th.id = td.header_id
            WHERE w.type = 'credit'
            GROUP BY w.id
        """).fetchall()
        for row in credit_rows:
            credit_balances[row[0]] = row[1]
        
        # Get debit/cash/digital/ewallet balances (sum of income)
        debit_balances = {}
        debit_rows = db.execute("""
            SELECT w.id, COALESCE(SUM(it.amount), 0) as total_income
            FROM wallets w
            LEFT JOIN income_transactions it ON w.id = it.wallet_id
            WHERE w.type IN ('debit', 'digital_bank', 'ewallet', 'cash')
            GROUP BY w.id
        """).fetchall()
        for row in debit_rows:
            debit_balances[row[0]] = row[1]
        
        # Update wallet balances with calculated values
        for wallet in wallets:
            if wallet['type'] == 'credit':
                wallet['balance'] = credit_balances.get(wallet['id'], 0.0)
            else:  # debit, digital_bank, ewallet, or cash
                wallet['balance'] = debit_balances.get(wallet['id'], 0.0)
        
        # 2c. Fetch wallet benefits from wallet_benefits table
        wallet_benefits_rows = db.execute("""
            SELECT wallet_id, category_id, rate, benefit_type
            FROM wallet_benefits
            WHERE is_active = 1
            AND (effective_from IS NULL OR effective_from <= date('now'))
            AND (effective_until IS NULL OR effective_until >= date('now'))
        """).fetchall()
        
        # Group benefits by wallet_id
        wallet_benefits_map = {}
        for row in wallet_benefits_rows:
            wallet_id = row[0]
            category_id = row[1]
            rate = row[2]
            if wallet_id not in wallet_benefits_map:
                wallet_benefits_map[wallet_id] = {}
            wallet_benefits_map[wallet_id][category_id] = rate
        
        # Add benefits to wallets
        for wallet in wallets:
            wallet['benefits'] = wallet_benefits_map.get(wallet['id'], {})
        
        # 3. Fetch Transactions (Recent)
        transactions = [dict(row) for row in db.execute("""
            SELECT th.*, td.category_id, td.line_amount, td.cashback_earned, td.billing_date
            FROM transaction_headers th
            JOIN transaction_details td ON th.id = td.header_id
            ORDER BY th.transaction_date DESC LIMIT 50
        """).fetchall()]
        
        # 4. Fetch Goals
        goals = [dict(row) for row in db.execute("SELECT * FROM savings_goals").fetchall()]
        
        # 5. Fetch Recommendations (All statuses)
        recommendations = [dict(row) for row in db.execute("SELECT * FROM strategic_recommendations ORDER BY created_at DESC").fetchall()]

        # 6. Fetch Budgets (Latest per category)
        budgets = [dict(row) for row in db.execute("""
            SELECT c.code as category, mb.amount
            FROM monthly_budgets mb
            JOIN categories c ON mb.category_id = c.id
            WHERE mb.month_year = '2026-02'
        """).fetchall()]

        # 7. Fetch MTD Cashback Summary
        cashback_mtd = [dict(row) for row in db.execute("""
            SELECT wallet_id, amount_earned, monthly_limit 
            FROM wallet_cashback_history 
            WHERE month_year = '2026-02'
        """).fetchall()]

        # 8. Fetch Total Income (from dedicated table)
        total_income = db.execute("SELECT SUM(amount) FROM income_transactions").fetchone()[0] or 0.0

        return {
            "categories": categories,
            "wallets": wallets,
            "transactions": transactions,
            "goals": goals,
            "recommendations": recommendations,
            "budgets": {b['category']: b['amount'] for b in budgets},
            "totalIncome": total_income,
            "cashbackMTD": cashback_mtd,
            "serverTime": "2026-02-07"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/recommendations/{rec_id}")
async def update_recommendation(rec_id: int, rec: RecommendationUpdate, db: Connection = Depends(get_db_session)):
    try:
        db.execute("UPDATE strategic_recommendations SET status = ? WHERE id = ?", (rec.status, rec_id))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions")
async def create_transaction(tx: TransactionBase, db: Connection = Depends(get_db_session)):
    try:
        # Insert Header
        cursor = db.execute("""
            INSERT INTO transaction_headers (wallet_id, merchant, total_amount, transaction_date, payment_type, description)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tx.wallet_id, tx.merchant, tx.total_amount, tx.transaction_date, tx.payment_type, tx.description))
        header_id = cursor.lastrowid
        
        # Calculate cashback using new wallet_benefits table
        cashback_rate = get_cashback_rate(db, tx.wallet_id, tx.category_id)
        cashback_earned = tx.total_amount * (cashback_rate / 100.0)

        # Insert Detail (Simplified for now, mapping 1:1 with header)
        db.execute("""
            INSERT INTO transaction_details (header_id, category_id, line_amount, billing_date, cashback_earned)
            VALUES (?, ?, ?, ?, ?)
        """, (header_id, tx.category_id, tx.total_amount, tx.transaction_date, cashback_earned))
        
        db.commit()
        return {"status": "success", "id": header_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wallets")
async def create_wallet(wallet: WalletBase, db: Connection = Depends(get_db_session)):
    print(f"DEBUG: Creating wallet with data: {wallet}")
    try:
        cursor = db.execute("""
            INSERT INTO wallets (name, provider_id, type, balance, credit_limit, cycle_day, due_day, monthly_cashback_limit, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (wallet.name, wallet.provider_id, wallet.type, wallet.balance, wallet.credit_limit, wallet.cycle_day, wallet.due_day, wallet.monthly_cashback_limit, wallet.color))
        wallet_id = cursor.lastrowid
        
        # Save benefits to wallet_benefits table
        if wallet.benefits:
            print(f"DEBUG: Saving benefits for wallet {wallet_id}: {wallet.benefits}")
            save_wallet_benefits(db, wallet_id, wallet.type, wallet.benefits)
        
        db.commit()
        print(f"DEBUG: Wallet created successfully with ID: {wallet_id}")
        return {"status": "success", "id": wallet_id}
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to create wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/wallets/{wallet_id}")
async def update_wallet(wallet_id: int, wallet: WalletBase, db: Connection = Depends(get_db_session)):
    print(f"DEBUG: Updating wallet {wallet_id} with data: {wallet}")
    try:
        db.execute("""
            UPDATE wallets 
            SET name = ?, provider_id = ?, type = ?, balance = ?, credit_limit = ?, cycle_day = ?, due_day = ?, monthly_cashback_limit = ?, color = ?
            WHERE id = ?
        """, (wallet.name, wallet.provider_id, wallet.type, wallet.balance, wallet.credit_limit, wallet.cycle_day, wallet.due_day, wallet.monthly_cashback_limit, wallet.color, wallet_id))
        
        # Update benefits in wallet_benefits table
        if wallet.benefits is not None:
            print(f"DEBUG: Updating benefits for wallet {wallet_id}: {wallet.benefits}")
            save_wallet_benefits(db, wallet_id, wallet.type, wallet.benefits)
        
        db.commit()
        print(f"DEBUG: Wallet {wallet_id} updated successfully")
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to update wallet {wallet_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/goals")
async def create_goal(goal: GoalBase, db: Connection = Depends(get_db_session)):
    try:
        cursor = db.execute("""
            INSERT INTO savings_goals (name, target_amount, current_amount, status)
            VALUES (?, ?, ?, 'active')
        """, (goal.name, goal.target_amount, goal.current_amount))
        db.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/transactions/{tx_id}")
async def update_transaction(tx_id: int, tx: TransactionBase, db: Connection = Depends(get_db_session)):
    try:
        # Calculate cashback using new wallet_benefits table
        cashback_rate = get_cashback_rate(db, tx.wallet_id, tx.category_id)
        cashback_earned = tx.total_amount * (cashback_rate / 100.0)

        db.execute("""
            UPDATE transaction_headers 
            SET wallet_id = ?, merchant = ?, total_amount = ?, transaction_date = ?, payment_type = ?, description = ?
            WHERE id = ?
        """, (tx.wallet_id, tx.merchant, tx.total_amount, tx.transaction_date, tx.payment_type, tx.description, tx_id))
        
        db.execute("""
            UPDATE transaction_details 
            SET category_id = ?, line_amount = ?, cashback_earned = ?
            WHERE header_id = ?
        """, (tx.category_id, tx.total_amount, cashback_earned, tx_id))
        
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: int, db: Connection = Depends(get_db_session)):
    try:
        db.execute("DELETE FROM transaction_details WHERE header_id = ?", (tx_id,))
        db.execute("DELETE FROM transaction_headers WHERE id = ?", (tx_id,))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
async def create_category(name: str, limit: float, db: Connection = Depends(get_db_session)):
    try:
        code = name.lower().replace(" ", "-")
        cursor = db.execute("""
            INSERT INTO categories (code, label)
            VALUES (?, ?)
        """, (code, name))
        cat_id = cursor.lastrowid
        
        # Also create initial budget
        db.execute("""
            INSERT INTO monthly_budgets (category_id, month_year, amount)
            VALUES (?, '2026-02', ?)
        """, (cat_id, limit))
        
        db.commit()
        return {"status": "success", "id": cat_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/providers")
async def get_providers(wallet_type: Optional[str] = None, db: Connection = Depends(get_db_session)):
    query = "SELECT * FROM providers WHERE is_active = 1"
    params = []
    
    if wallet_type:
        query += " AND wallet_type = ?"
        params.append(wallet_type)
    
    query += " ORDER BY name ASC"
    
    providers = [dict(row) for row in db.execute(query, params).fetchall()]
    return {"providers": providers}
