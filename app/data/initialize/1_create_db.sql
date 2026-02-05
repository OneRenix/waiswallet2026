-- Table 1: categories
-- Optimized with Integer PK and a machine-readable 'code' slug
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,            -- e.g., 'groceries'
    label TEXT NOT NULL,                  -- e.g., 'Groceries & Mart'
    icon_name TEXT,
    color_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: wallets
CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT,                        -- e.g., 'BPI', 'EastWest'
    type TEXT CHECK(type IN ('credit', 'debit', 'cash')),
    balance REAL DEFAULT 0.0,             -- Current Outstanding Debt / Cash
    available_credit REAL,                -- Credit Limit minus all obligations
    credit_limit REAL,
    cycle_day INTEGER,
    due_day INTEGER,
    monthly_cashback_limit REAL DEFAULT 1500.0,
    cashback_ytd REAL DEFAULT 0.0,
    version INTEGER DEFAULT 1,            -- For optimistic locking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: income_sources
CREATE TABLE IF NOT EXISTS income_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT,
    category TEXT DEFAULT 'salary',
    frequency TEXT CHECK(frequency IN ('monthly', 'bi-weekly', 'weekly', 'sporadic')),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: transaction_headers
CREATE TABLE IF NOT EXISTS transaction_headers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    merchant TEXT NOT NULL,
    transaction_date TEXT NOT NULL,       -- ISO8601 (The 'Swipe' date)
    total_amount REAL NOT NULL,           -- Full purchase price
    payment_type TEXT CHECK(payment_type IN ('straight', 'installment')),
    description TEXT,                     -- General note (e.g., 'MacBook Purchase')
    executed_by TEXT NOT NULL DEFAULT 'user',
    confidence_score REAL,
    needs_review BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'posted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Table 5: transaction_details
CREATE TABLE IF NOT EXISTS transaction_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    header_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,        -- Linked via Integer ID
    description TEXT,                     -- Item note (e.g., 'M3 Chip Upgrade')
    line_amount REAL NOT NULL,            -- Monthly share for installments
    billing_date TEXT NOT NULL,           -- The actual date it hits the statement
    installments_total INTEGER DEFAULT NULL,
    installment_number INTEGER DEFAULT NULL,
    cashback_earned REAL DEFAULT 0.0,
    status TEXT DEFAULT 'upcoming',       -- 'upcoming', 'billed', 'paid'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (header_id) REFERENCES transaction_headers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Table 6: income_transactions
CREATE TABLE IF NOT EXISTS income_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    wallet_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    executed_by TEXT NOT NULL DEFAULT 'user',
    reference_no TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES income_sources(id),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Table 7: wallet_ledger
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    entry_type TEXT CHECK(entry_type IN ('DEBIT', 'CREDIT')),
    amount REAL NOT NULL,
    previous_balance REAL NOT NULL,
    new_balance REAL NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: wallet_cashback_history
CREATE TABLE IF NOT EXISTS wallet_cashback_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    month_year TEXT NOT NULL,             -- 'YYYY-MM'
    amount_earned REAL DEFAULT 0.0,
    monthly_limit REAL NOT NULL, 
    is_capped BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    UNIQUE(wallet_id, month_year)
);

-- Table 9: monthly_budgets
CREATE TABLE IF NOT EXISTS monthly_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    month_year TEXT NOT NULL, 
    amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(category_id, month_year)
);

-- Table 10: chat_logs
CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    sender TEXT CHECK(sender IN ('user', 'buddy')),
    message TEXT NOT NULL,
    feedback TEXT CHECK(feedback IN ('up', 'down', NULL)),
    metadata JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 11: savings_goals
CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                  -- e.g., 'Japan Trip 2026'
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0.0,
    deadline TEXT,                       -- ISO8601
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
    priority_level INTEGER DEFAULT 1,    -- 1 (Highest) to 5 (Lowest)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 12: budget_simulations
CREATE TABLE IF NOT EXISTS budget_simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    simulated_amount REAL NOT NULL,
    payment_type TEXT CHECK(payment_type IN ('straight', 'installment')),
    urgency TEXT CHECK(urgency IN ('need_now', 'can_wait')),
    linked_goal_id INTEGER,              -- Optional: How does this affect your Japan Trip?
    recommendation TEXT,                 -- AI's Verdict: 'Go', 'No-Go', 'Wait'
    pilot_reasoning TEXT,                -- The "Why" behind the AI advice
    impact_on_balance REAL,              -- Projected balance after purchase
    confidence_score REAL,               -- AI's certainty (0.0 to 1.0)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (linked_goal_id) REFERENCES savings_goals(id)
);

-- Table 13: strategic_recommendations
CREATE TABLE IF NOT EXISTS strategic_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,                 -- e.g., 'Optimization Opportunity'
    message TEXT NOT NULL,               -- e.g., 'Switch to BPI for this Grocery run'
    urgency_level TEXT CHECK(urgency_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Notification Controls
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'dismissed', 'snoozed', 'acted_upon')),
    reminder_frequency TEXT DEFAULT 'weekly' CHECK(reminder_frequency IN ('daily', 'weekly', 'bi-weekly')),
    remind_at TIMESTAMP,                 -- The next scheduled time to notify the user
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 14: recurring_expenses
-- Templates for indefinite recurring payments (Utilities, Subscriptions)
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                  -- e.g., 'Meralco', 'PLDT', 'Netflix'
    category_id INTEGER NOT NULL,        -- Links to Table 1
    default_wallet_id INTEGER,           -- Optional: Preferred payment method
    amount_estimate REAL,                -- Expected amount for matching
    frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly')),
    day_of_month INTEGER,                -- Expected billing day (1-31)
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (default_wallet_id) REFERENCES wallets(id)
);