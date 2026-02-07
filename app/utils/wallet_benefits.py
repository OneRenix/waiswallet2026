"""
Helper functions for wallet_benefits table operations
"""
from sqlite3 import Connection
from typing import Dict, List, Optional
import json


def get_wallet_benefits(db: Connection, wallet_id: int, category_id: Optional[int] = None) -> Dict[int, float]:
    """
    Get wallet benefits from the wallet_benefits table.
    
    Args:
        db: Database connection
        wallet_id: Wallet ID
        category_id: Optional category ID to get specific benefit
        
    Returns:
        Dictionary mapping category_id to rate (as percentage)
    """
    if category_id:
        row = db.execute("""
            SELECT rate FROM wallet_benefits
            WHERE wallet_id = ? AND category_id = ? AND is_active = 1
            AND (effective_from IS NULL OR effective_from <= date('now'))
            AND (effective_until IS NULL OR effective_until >= date('now'))
        """, (wallet_id, category_id)).fetchone()
        return {category_id: row[0]} if row else {}
    else:
        rows = db.execute("""
            SELECT category_id, rate FROM wallet_benefits
            WHERE wallet_id = ? AND is_active = 1
            AND (effective_from IS NULL OR effective_from <= date('now'))
            AND (effective_until IS NULL OR effective_until >= date('now'))
        """, (wallet_id,)).fetchall()
        return {row[0]: row[1] for row in rows}


def save_wallet_benefits(db: Connection, wallet_id: int, wallet_type: str, benefits: Dict[int, float]) -> None:
    """
    Save wallet benefits to the wallet_benefits table.
    
    Args:
        db: Database connection
        wallet_id: Wallet ID
        wallet_type: Wallet type ('credit', 'debit', or 'cash')
        benefits: Dictionary mapping category_id to rate
    """
    # Determine benefit type based on wallet type
    if wallet_type == 'credit':
        benefit_type = 'cashback'
    elif wallet_type == 'debit':
        benefit_type = 'interest'
    else:
        # Cash wallets typically don't have benefits, but we'll support it
        benefit_type = 'cashback'
    
    # Delete existing benefits for this wallet
    db.execute("DELETE FROM wallet_benefits WHERE wallet_id = ?", (wallet_id,))
    
    # Insert new benefits
    for category_id, rate in benefits.items():
        if rate > 0:  # Only insert non-zero rates
            db.execute("""
                INSERT INTO wallet_benefits (wallet_id, category_id, benefit_type, rate, is_active)
                VALUES (?, ?, ?, ?, 1)
            """, (wallet_id, category_id, benefit_type, rate))


def get_wallet_benefits_legacy(db: Connection, wallet_id: int) -> Dict[str, float]:
    """
    DEPRECATED: Get wallet benefits from the legacy JSON benefits field.
    This is for backward compatibility during migration.
    
    Args:
        db: Database connection
        wallet_id: Wallet ID
        
    Returns:
        Dictionary mapping category_id (as string) to rate
    """
    wallet_row = db.execute("SELECT benefits FROM wallets WHERE id = ?", (wallet_id,)).fetchone()
    benefits = {}
    if wallet_row and wallet_row[0]:
        try:
            benefits = json.loads(wallet_row[0])
        except:
            benefits = {}
    return benefits


def get_cashback_rate(db: Connection, wallet_id: int, category_id: int) -> float:
    """
    Get the cashback/interest rate for a specific wallet and category.
    Falls back to legacy JSON field if not found in wallet_benefits table.
    
    Args:
        db: Database connection
        wallet_id: Wallet ID
        category_id: Category ID
        
    Returns:
        Rate as a percentage (e.g., 4.0 for 4%)
    """
    # Try new table first
    benefits = get_wallet_benefits(db, wallet_id, category_id)
    if benefits:
        return benefits.get(category_id, 0.0)
    
    # Fall back to legacy JSON field
    legacy_benefits = get_wallet_benefits_legacy(db, wallet_id)
    return float(legacy_benefits.get(str(category_id), 0.0))
