-- ==========================================================
-- 1. MASTER DATA: CATEGORIES
-- ==========================================================
INSERT INTO categories (id, code, label, icon_name, color_code)
VALUES (
        1,
        'groceries',
        'Groceries & Mart',
        'shopping-cart',
        '#4ade80'
    ),
    (
        2,
        'dining',
        'Restaurants & Dining',
        'utensils',
        '#f87171'
    ),
    (
        3,
        'transport',
        'Transportation',
        'car',
        '#60a5fa'
    ),
    (
        4,
        'subscriptions',
        'Digital Subs',
        'rss',
        '#a78bfa'
    ),
    (
        5,
        'shopping',
        'Shopping',
        'shopping-bag',
        '#fb923c'
    ),
    -- Fixed: Added ID 5
    (
        6,
        'utilities',
        'Bills & Utilities',
        'lightning-bolt',
        '#facc15'
    );
-- ==========================================================
-- 2. MASTER DATA: WALLETS
-- ==========================================================
-- ==========================================================
-- 2. MASTER DATA: WALLETS
-- ==========================================================
-- NOTE: provider_ids are based on the seed order in 1_create_db.sql
-- 1: BPI(cr), 2: BDO(cr), 3: EastWest(cr), 4: BPI(db), 5: BDO(db)...
INSERT INTO wallets (
        id,
        name,
        provider_id,
        color,
        type,
        balance,
        available_credit,
        credit_limit,
        cycle_day,
        due_day,
        monthly_cashback_limit
    )
VALUES (
        1,
        'Amore Cashback',
        1,
        '#3b82f6',
        'credit',
        0.0,
        50000.0,
        50000.0,
        26,
        15,
        1000.0
    );
INSERT INTO wallets (
        id,
        name,
        provider_id,
        color,
        type,
        balance,
        available_credit,
        credit_limit,
        cycle_day,
        due_day,
        monthly_cashback_limit
    )
VALUES (
        2,
        'EastWest Visa',
        3,
        '#f43f5e',
        'credit',
        0.0,
        100000.0,
        100000.0,
        5,
        25,
        1500.0
    );
INSERT INTO wallets (
        id,
        name,
        provider_id,
        color,
        type,
        balance,
        available_credit,
        credit_limit,
        cycle_day,
        due_day,
        monthly_cashback_limit
    )
VALUES (
        3,
        'Main Savings',
        5,
        '#22c55e',
        'debit',
        85000.0,
        85000.0,
        NULL,
        NULL,
        NULL,
        0.0
    );
-- ==========================================================
-- 2b. MASTER DATA: WALLET BENEFITS (Cashback Rates)
-- ==========================================================
INSERT INTO wallet_benefits (wallet_id, category_id, benefit_type, rate)
VALUES -- Amore Cashback (Wallet 1): 4% Groceries, 1% Shopping
    (1, 1, 'cashback', 4.0),
    (1, 5, 'cashback', 1.0),
    -- EastWest Visa (Wallet 2): 5% Dining, Transport, Subs
    (2, 2, 'cashback', 5.0),
    (2, 3, 'cashback', 5.0),
    (2, 4, 'cashback', 5.0);
-- ==========================================================
-- 3. TRANSACTIONS (Feb 2026)
-- ==========================================================
-- GROCERIES (ID: 1)
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        description
    )
VALUES (
        1,
        'SM Supermarket',
        '2026-02-01',
        3500.0,
        'Weekly Grocery'
    );
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date,
        cashback_earned
    )
VALUES (
        last_insert_rowid(),
        1,
        3500.0,
        '2026-02-01',
        140.0
    );
-- DINING (ID: 2)
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        description
    )
VALUES (
        2,
        'GrabFood',
        '2026-02-02',
        850.0,
        'Dinner Delivery'
    );
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date,
        cashback_earned
    )
VALUES (
        last_insert_rowid(),
        2,
        850.0,
        '2026-02-02',
        42.5
    );
-- TRANSPORT (ID: 3)
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        description
    )
VALUES (
        3,
        'Grab Car',
        '2026-02-02',
        350.0,
        'Ride to BGC Office'
    );
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date
    )
VALUES (last_insert_rowid(), 3, 350.0, '2026-02-02');
-- SUBSCRIPTIONS (ID: 4)
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        description
    )
VALUES (2, 'Netflix', '2026-02-01', 549.0, 'Premium 4K');
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date,
        cashback_earned
    )
VALUES (
        last_insert_rowid(),
        4,
        549.0,
        '2026-02-01',
        27.45
    );
-- SHOPPING (ID: 5)
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        description
    )
VALUES (
        1,
        'Shopee',
        '2026-02-02',
        1250.0,
        'Air Fryer Accessories'
    );
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date,
        cashback_earned
    )
VALUES (
        last_insert_rowid(),
        5,
        1250.0,
        '2026-02-02',
        12.5
    );
-- UTILITIES (ID: 6)
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        description
    )
VALUES (
        3,
        'Meralco',
        '2026-02-02',
        6200.0,
        'Electric Bill'
    );
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date
    )
VALUES (last_insert_rowid(), 6, 6200.0, '2026-02-02');
-- ==========================================================
-- 4. BNPL DEFERRED: MacBook (ID: 5)
-- ==========================================================
INSERT INTO transaction_headers (
        wallet_id,
        merchant,
        transaction_date,
        total_amount,
        payment_type,
        description
    )
VALUES (
        2,
        'Beyond the Box',
        '2026-02-02',
        72000.0,
        'installment',
        'MacBook Air M3'
    );
-- Using a variable to capture the MacBook Header ID
-- (Note: In a raw SQL script, you'd use last_insert_rowid() immediately)
INSERT INTO transaction_details (
        header_id,
        category_id,
        line_amount,
        billing_date,
        installments_total,
        installment_number
    )
VALUES (
        last_insert_rowid(),
        5,
        6000.0,
        '2026-05-02',
        12,
        1
    ),
    (
        last_insert_rowid(),
        5,
        6000.0,
        '2026-06-02',
        12,
        2
    );
-- ==========================================================
-- 5. INITIAL PLANNING DATA
-- ==========================================================
INSERT INTO monthly_budgets (category_id, month_year, amount)
VALUES (1, '2026-02', 15000.0),
    -- Groceries (Conservative)
    (2, '2026-02', 8000.0),
    -- Dining (Aggressive target for your EastWest card)
    (3, '2026-02', 5000.0),
    -- Transport (High due to Grab rides)
    (4, '2026-02', 1500.0),
    -- Subscriptions (Low, Netflix + YT + Spotify ~₱1k)
    (5, '2026-02', 10000.0),
    -- Shopping (Testing your Shopee/Lazada habit)
    (6, '2026-02', 12000.0);
-- Utilities (Covers Meralco + Water + Internet)
-- ==========================================================
-- 1. SAVINGS GOALS: Real-world targets
-- ==========================================================
INSERT INTO savings_goals (
        name,
        target_amount,
        current_amount,
        deadline,
        priority_level
    )
VALUES (
        'Emergency Fund',
        150000.0,
        45000.0,
        '2026-12-31',
        1
    ),
    -- Priority 1: Critical
    (
        'Japan Trip 2026',
        100000.0,
        15000.0,
        '2026-11-20',
        2
    ),
    (
        'New Office Desk',
        15000.0,
        2000.0,
        '2026-04-15',
        3
    );
-- ==========================================================
-- 2. BUDGET SIMULATIONS: "Can I afford a PS5?"
-- ==========================================================
INSERT INTO budget_simulations (
        wallet_id,
        category_id,
        simulated_amount,
        payment_type,
        urgency,
        linked_goal_id,
        recommendation,
        pilot_reasoning,
        impact_on_balance,
        confidence_score
    )
VALUES (
        2,
        -- EastWest Visa
        5,
        -- Shopping
        30000.0,
        'installment',
        'can_wait',
        2,
        -- Linked to Japan Trip
        'No-Go (Wait)',
        'Buying this now will delay your Japan Trip goal by 2.5 months. Suggest waiting until after your bonus in March.',
        30000.0,
        0.92
    );
-- ==========================================================
-- 3. STRATEGIC RECOMMENDATIONS: No-Pressure Notifications
-- ==========================================================
-- Suggestion 1: High Urgency Optimization (BPI Amore vs Grab)
INSERT INTO strategic_recommendations (
        title,
        message,
        urgency_level,
        status,
        reminder_frequency,
        remind_at
    )
VALUES (
        'Cashback Optimization',
        'You spent ₱3,500 on Grab using BDO Debit. Switching to EastWest Visa for Grab next time could save you ₱175 in cashback.',
        'medium',
        'pending',
        'weekly',
        datetime('now', '+3 days') -- Set to remind in 3 days (Quick Nudge)
    );
-- Suggestion 2: Goal Progress Update
INSERT INTO strategic_recommendations (
        title,
        message,
        urgency_level,
        status,
        reminder_frequency,
        remind_at
    )
VALUES (
        'Emergency Fund Milestone',
        'You are 30% of the way to your Emergency Fund! Keep it up. Consider moving ₱5,000 from current savings to lock in this progress.',
        'low',
        'pending',
        'bi-weekly',
        datetime('now', '+5 days') -- Set to remind in 5 days (Weekend Review)
    );
-- ==========================================================
-- 4. RECURRING EXPENSES (Templates)
-- ==========================================================
INSERT INTO recurring_expenses (
        name,
        category_id,
        default_wallet_id,
        amount_estimate,
        frequency,
        day_of_month
    )
VALUES ('Meralco Bill', 6, 3, 6500.0, 'monthly', 15),
    ('PLDT Home Fiber', 6, 3, 2099.0, 'monthly', 20),
    ('Netflix', 4, 1, 549.0, 'monthly', 1),
    ('Spotify Family', 4, 1, 194.0, 'monthly', 5);