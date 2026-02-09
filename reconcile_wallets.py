import sqlite3
import os

DB_PATH = "app/data/waiswallet.db"

def reconcile():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("🚀 Starting Wallet Reconciliation...")

    try:
        # 1. Fetch all wallets
        wallets = cursor.execute("SELECT id, name, type, credit_limit FROM wallets").fetchall()

        for wallet in wallets:
            w_id = wallet['id']
            w_name = wallet['name']
            w_type = wallet['type']
            w_limit = wallet['credit_limit'] or 0

            # 2. Sum Transactions
            expenses = cursor.execute(
                "SELECT SUM(total_amount) FROM transaction_headers WHERE wallet_id = ?", (w_id,)
            ).fetchone()[0] or 0

            # 3. Sum Incomes
            incomes = cursor.execute(
                "SELECT SUM(amount) FROM income_transactions WHERE wallet_id = ?", (w_id,)
            ).fetchone()[0] or 0

            # 4. Calculate New Balance
            # For Credit: Balance is DEBT. Start at 0, add expenses, subtract payments (income).
            # For Liquid: Balance is CASH. Start at 0 (or initial), add income, subtract expenses.
            # NOTE: In this app, we assume starting balance represented in initialization was 0 if we rely strictly on history.
            # However, to be safe, we'll assume the current 'history' is complete for the demo.
            
            if w_type == 'credit':
                new_balance = expenses - incomes
                new_available = w_limit - new_balance
            else:
                new_balance = incomes - expenses
                new_available = 0 # Not applicable to debit

            print(f"  - {w_name} ({w_type}): Bal={new_balance}, Avail={new_available}")

            # 5. Update Wallet
            cursor.execute("""
                UPDATE wallets 
                SET balance = ?, available_credit = ?, version = version + 1 
                WHERE id = ?
            """, (new_balance, new_available, w_id))

        conn.commit()
        print("\n✅ Reconciliation Complete! All wallets are in sync with history.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error during reconciliation: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    reconcile()
