-- ==========================================================
-- 1. AUTOMATIC TIMESTAMP MANAGEMENT
-- Updates the 'updated_at' column whenever a record is modified
-- ==========================================================
CREATE TRIGGER IF NOT EXISTS trg_categories_updated_at
AFTER
UPDATE ON categories BEGIN
UPDATE categories
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_wallets_updated_at
AFTER
UPDATE ON wallets BEGIN
UPDATE wallets
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_transaction_headers_updated_at
AFTER
UPDATE ON transaction_headers BEGIN
UPDATE transaction_headers
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_transaction_details_updated_at
AFTER
UPDATE ON transaction_details BEGIN
UPDATE transaction_details
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_income_sources_updated_at
AFTER
UPDATE ON income_sources BEGIN
UPDATE income_sources
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_wallet_cashback_history_updated_at
AFTER
UPDATE ON wallet_cashback_history BEGIN
UPDATE wallet_cashback_history
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_recurring_expenses_updated_at
AFTER
UPDATE ON recurring_expenses BEGIN
UPDATE recurring_expenses
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
-- ==========================================================
-- 2. FINANCIAL INTEGRITY & AUDIT LEDGER
-- ==========================================================
-- Trigger: Automatically update Wallet Ledger on Balance Change
-- This creates your immutable audit trail for the demo
CREATE TRIGGER IF NOT EXISTS audit_wallet_balance_update
AFTER
UPDATE OF balance ON wallets BEGIN
INSERT INTO wallet_ledger (
        wallet_id,
        entry_type,
        amount,
        previous_balance,
        new_balance,
        reason,
        created_at
    )
VALUES (
        NEW.id,
        CASE
            WHEN NEW.balance > OLD.balance THEN 'CREDIT'
            ELSE 'DEBIT'
        END,
        ABS(NEW.balance - OLD.balance),
        OLD.balance,
        NEW.balance,
        'Balance Update (Triggered)',
        CURRENT_TIMESTAMP
    );
END;
-- Trigger: Sync Wallet Balance & Credit on New Transaction
-- Note: 'balance' tracks current debt for Credit, cash for others.
CREATE TRIGGER IF NOT EXISTS sync_balance_on_transaction
AFTER
INSERT ON transaction_headers BEGIN
UPDATE wallets
SET balance = CASE
        WHEN type = 'credit' THEN balance + NEW.total_amount -- Increase debt
        ELSE balance - NEW.total_amount -- Decrease cash
    END,
    available_credit = CASE
        WHEN type = 'credit' THEN available_credit - NEW.total_amount
        ELSE available_credit
    END,
    version = version + 1
WHERE id = NEW.wallet_id;
END;
-- Trigger: Sync Wallet Balance on Income
CREATE TRIGGER IF NOT EXISTS sync_balance_on_income
AFTER
INSERT ON income_transactions BEGIN
UPDATE wallets
SET balance = CASE
        WHEN type = 'credit' THEN balance - NEW.amount -- Paying off debt
        ELSE balance + NEW.amount -- Adding to savings
    END,
    available_credit = CASE
        WHEN type = 'credit' THEN available_credit + NEW.amount
        ELSE available_credit
    END,
    version = version + 1
WHERE id = NEW.wallet_id;
END;
-- NEW TRIGGER: Match transaction to recurring expense
-- Links transaction_details to recurring_expenses if category and amount (approx) match
CREATE TRIGGER IF NOT EXISTS match_transaction_to_recurring
AFTER
INSERT ON transaction_details BEGIN -- This trigger could update a 'recurring_id' column if we added one, 
    -- but for now let's use it to 'tag' the description if it matches
    -- to demonstrate the AI pilot can see the connection.
UPDATE transaction_details
SET description = description || ' [Matched Recurring: ' || (
        SELECT name
        FROM recurring_expenses
        WHERE category_id = NEW.category_id
            AND ABS(NEW.line_amount - amount_estimate) / amount_estimate <= 0.10
        LIMIT 1
    ) || ']'
WHERE id = NEW.id
    AND EXISTS (
        SELECT 1
        FROM recurring_expenses
        WHERE category_id = NEW.category_id
            AND ABS(NEW.line_amount - amount_estimate) / amount_estimate <= 0.10
    );
END;
-- ==========================================================
-- 3. CASHBACK OPTIMIZATION (THE ₱1,500 CAP LOGIC)
-- ==========================================================
CREATE TRIGGER IF NOT EXISTS manage_cashback_and_history
AFTER
INSERT ON transaction_details FOR EACH ROW
    WHEN NEW.cashback_earned > 0 BEGIN -- 1. Ensure the monthly history bucket exists (using the header's wallet)
INSERT
    OR IGNORE INTO wallet_cashback_history (wallet_id, month_year, monthly_limit)
SELECT h.wallet_id,
    strftime('%Y-%m', 'now'),
    w.monthly_cashback_limit
FROM transaction_headers h
    JOIN wallets w ON h.wallet_id = w.id
WHERE h.id = NEW.header_id;
-- 2. Update the monthly history with the capping logic
UPDATE wallet_cashback_history
SET is_capped = CASE
        WHEN (amount_earned + NEW.cashback_earned) >= monthly_limit THEN 1
        ELSE 0
    END,
    amount_earned = CASE
        WHEN (amount_earned + NEW.cashback_earned) > monthly_limit THEN monthly_limit
        ELSE amount_earned + NEW.cashback_earned
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE wallet_id = (
        SELECT wallet_id
        FROM transaction_headers
        WHERE id = NEW.header_id
    )
    AND month_year = strftime('%Y-%m', 'now');
-- 3. Update the Year-to-Date total in the master wallet table
UPDATE wallets
SET cashback_ytd = cashback_ytd + NEW.cashback_earned
WHERE id = (
        SELECT wallet_id
        FROM transaction_headers
        WHERE id = NEW.header_id
    );
END;