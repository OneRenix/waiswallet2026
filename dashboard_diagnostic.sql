-- 📊 WaisWallet Dashboard Diagnostic Queries
-- Use this file to verify if the UI data matches the database records.
-- 1. Total Expenses (Current Month: February 2026)
-- Sums all non-income transactions for the current month.
SELECT 'Total Expenses' as Metric,
    PRINTF('₱%,.2f', SUM(total_amount)) as Value
FROM transaction_headers
WHERE strftime('%Y-%m', transaction_date) = '2026-02';
-- 2. Total Income (Current Month: February 2026)
-- Sums all income records from the dedicated income_transactions table.
SELECT 'Total Income' as Metric,
    PRINTF('₱%,.2f', SUM(amount)) as Value
FROM income_transactions;
-- 3. Estimated Cashback (Total Earned YTD across all wallets)
-- This matches the 'Estimated Cashback' card on your dashboard.
SELECT 'Estimated Cashback (YTD)' as Metric,
    PRINTF('₱%,.2f', SUM(cashback_ytd)) as Value
FROM wallets;
-- 4. Budget vs. Spending (Per Category)
-- Shows how much you've spent vs. your monthly limit.
SELECT c.label as Category,
    PRINTF('₱%,.2f', mb.amount) as Monthly_Budget,
    PRINTF('₱%,.2f', IFNULL(SUM(td.line_amount), 0)) as Amount_Spent,
    ROUND(
        (IFNULL(SUM(td.line_amount), 0) / mb.amount) * 100,
        1
    ) || '%' as Progress
FROM categories c
    JOIN monthly_budgets mb ON c.id = mb.category_id
    LEFT JOIN transaction_details td ON c.id = td.category_id
    AND strftime('%Y-%m', td.billing_date) = '2026-02'
WHERE mb.month_year = '2026-02'
GROUP BY c.id;
-- 5. Card Strategy (Wallet Overview)
-- Lists your cards, their current balances, and cashback performance.
SELECT name as Card_Name,
    provider as Bank,
    UPPER(type) as Type,
    PRINTF('₱%,.2f', balance) as Current_Balance,
    PRINTF('₱%,.2f', credit_limit) as Credit_Limit,
    PRINTF('₱%,.2f', cashback_ytd) as Cashback_Earned_YTD
FROM wallets;
-- 6. Recent Activity (Last 5 Transactions)
SELECT transaction_date as Date,
    merchant as Merchant,
    PRINTF('₱%,.2f', total_amount) as Amount,
    payment_type as Mode
FROM transaction_headers
ORDER BY transaction_date DESC
LIMIT 5;