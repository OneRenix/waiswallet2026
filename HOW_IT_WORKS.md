# 🌐 Modular Data Flow: Dashboard Components

This guide breaks down exactly how each card on your dashboard is generated, from the database query to the final UI element.

---

## 1. 💰 Total Income
The "Gasoline" for your wallet. It shows how much money has come in.

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```python
# Fetches the sum of all income transactions
total_income = db.execute("SELECT SUM(amount) FROM income_transactions").fetchone()[0] or 0.0
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Stores the value in the global state
this.totalIncome = data.totalIncome || 0;
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Displays the value in the emerald card
const totalIncome = state.totalIncome;
const html = `<p>${formatCurrency(totalIncome)}</p>`;
```
````

---

## 2. 💸 Total Expenses
Your total spending for the current month.

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```sql
-- Fetches all line items from the current month
SELECT SUM(td.line_amount) 
FROM transaction_details td 
WHERE strftime('%Y-%m', td.billing_date) = '2026-02';
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Filters out 'income' category from the transactions list
this.transactions = data.transactions.map(...);
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Sums up all non-income transactions in memory
const totalExpenses = state.transactions
    .filter(t => t.category !== 'income')
    .reduce((a, t) => a + t.amount, 0);
```
````

---

## 3. 💎 Estimated Cashback
The rewards you've earned from smart card usage.

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```sql
-- Fetches the YTD cashback column from the wallets table
SELECT name, cashback_ytd FROM wallets;
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Maps database column 'cashback_ytd' to UI property 'cashbackYTD'
this.cards = data.wallets.map(w => ({
    ...w,
    cashbackYTD: w.cashback_ytd || 0
}));
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Aggregates cashback from all cards
const totalCashback = state.cards.reduce((a, c) => a + c.cashbackYTD, 0);
```
````

---

## 4. 📊 Budgets & Categories
The "Guardrails" for your spending per life department.

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```sql
-- Fetches the full category master data and budget limits
SELECT c.label, c.icon_name, c.color_code, mb.amount 
FROM categories c
JOIN monthly_budgets mb ON c.id = mb.category_id 
WHERE mb.month_year = '2026-02';
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Enriches categories with UI-specific properties
this.categories = data.categories.map(c => ({
    ...c,
    label: c.label, // Human-readable name
    icon: c.icon_name, // e.g. "shopping-cart"
    bg: this.mapColorToBg(c.color_code), // maps hex to tailwind
    color: this.mapColorToText(c.color_code)
}));
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Renders the name and icon from the enriched state
return `
    <div class="flex items-center gap-2">
        <div class="icon-box ${cat.bg}">
            <i data-lucide="${cat.icon}"></i>
        </div>
        <span>${cat.label}</span>
    </div>
    ...
`;
```
````

---

## 5. 🎯 Financial Goals
Your long-term targets (e.g., Japan Trip, Emergency Fund).

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```sql
-- Fetches all records from the savings_goals table
SELECT name, target_amount, current_amount, color, icon FROM savings_goals;
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Enriches data with fallback colors and icons if missing in DB
this.goals = data.goals.map(g => ({
    ...g,
    current: g.current_amount,
    target: g.target_amount,
    color: g.color || 'bg-blue-600'
}));
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Calculates progress percentage and creates the progress bar
const pct = Math.min((g.current / g.target) * 100, 100);
const html = `<div class="h-full ${g.color}" style="width: ${pct}%"></div>`;
```
````

---

## 6. 💳 Card Strategy (Wallets)
The optimized view of your liquidity and credit cycles.

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```sql
-- Basic wallet data
SELECT name, balance, credit_limit, cycle_day, due_day FROM wallets;
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Determines color/icon based on wallet type (Credit vs Debit)
this.cards = data.wallets.map(w => ({
    ...w,
    color: w.type === 'credit' ? 'bg-indigo-600' : 'bg-emerald-600',
    icon: w.type === 'credit' ? 'credit-card' : 'wallet'
}));
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Uses getCycleStatus utility to calculate 'Cycle Health'
const cycle = getCycleStatus(c.cycleDate, state.currentDate);
const statusText = cycle.statusText; // e.g., "Early Cycle"
```
````

---

## 7. 📜 Recent Transactions
The audit trail of your latest purchases.

````carousel
**Backend (Python/SQL)**
*File: [app/routers/api.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/routers/api.py)*
```sql
-- JOINS headers (merchant/date) with details (category)
SELECT th.merchant, th.transaction_date, td.category_id 
FROM transaction_headers th 
JOIN transaction_details td ON th.id = td.header_id 
ORDER BY th.transaction_date DESC LIMIT 5;
```
<!-- slide -->
**State (TypeScript)**
*File: [frontend/src/state.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/state.ts)*
```typescript
// Looks up the category name from the categories ID
const cat = data.categories.find(c => c.id === t.category_id);
this.transactions = data.transactions.map(...)
```
<!-- slide -->
**UI (JS/Dashboard)**
*File: [frontend/src/modules/dashboard.ts](file:///Users/ultrenzv/Documents/DEV/waiswallet/frontend/src/modules/dashboard.ts)*
```javascript
// Maps merchants to icons and formats negative numbers
const isIncome = t.category === 'income';
const amountClass = isIncome ? 'text-emerald-600' : 'text-rose-600';
```
````

---

> [!NOTE]
> All backend logic for these components resides in `app/routers/api.py`, while all UI rendering logic is inside `frontend/src/modules/dashboard.ts`.
