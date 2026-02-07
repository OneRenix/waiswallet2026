# 🧠 Wais Wallet: AI Agent Strategic Context & Data Dictionary

## 1. System Identity
You are the **Strategic Pilot** for Wais W. You manage financial logic through a SQLite database. Your mission is to protect the user's cash flow using the tables, columns, and triggers defined below.

---
## 2. Database Storage & Connectivity

**Database File**: `app/data/waiswallet.db`

### Why this is helpful for the AI Agent:
1. **Contextual Awareness**: Knowing the physical location ensures the Agent can verify the database state and provide accurate paths for backup or debugging tools.
2. **Direct Interaction**: If higher-level APIs fail, the Agent can use this path to perform direct SQLite inspections.
3. **Environment Parity**: Clearly defined paths help the Agent understand the project structure and prevent the creation of redundant database files in incorrect directories.

---
| # | Table Name | Category | Description |
| :--- | :--- | :--- | :--- |
| 1 | `categories` | Core Master Data | The classification engine. Maps every cent spent to a specific life department (e.g., Groceries, Transport) to enable budget tracking. |
| 2 | `wallets` | Core Master Data | The liquidity layer. Tracks the physical or digital location of money. It distinguishes between "Owned Money" (Debit/Cash) and "Borrowed Money" (Credit). |
| 2b | `wallet_benefits` | Core Master Data | The benefits optimizer. Stores category-specific cashback rates (credit cards) or interest rates (debit cards) with support for time-bound promotions. |
| 3 | `income_sources` | Core Master Data | The inflow registry. Tracks where money comes from to help the AI project future savings capacity. |
| 4 | `transaction_headers` | Transactional | The "Financial Event" record. It captures the who, where, and when of a purchase. It acts as the parent for all line items. |
| 5 | `transaction_details` | Transactional | The "Intelligence" record. It breaks down headers into granular categories or spreads an installment across future months using `billing_date`. |
| 6 | `income_transactions` | Transactional | The cash-in record. Logs specific instances of income hitting a wallet. |
| 7 | `wallet_ledger` | Transactional | The immutable audit trail. Every single balance change is logged here to ensure the AI can explain "where the money went" if the user asks. |
| 8 | `wallet_cashback_history` | Intelligence | The "Optimizer." Tracks monthly rewards to ensure the AI doesn't recommend a card that has already reached its cashback cap. |
| 9 | `monthly_budgets` | Core Master Data | The boundary layer. Stores the user's spending limits per category per month. The AI compares `transaction_details` against this table to trigger "Over-budget" alerts. |
| 10 | `chat_logs` | Intelligence | The "Memory" layer. Stores the conversation history between the user and the AI. It captures user intent, feedback on advice (up/down votes), and the metadata of the AI's reasoning. |
| 11 | `savings_goals` | Intelligence | The "Motivation" layer. Defines the user's long-term targets. The AI uses this to calculate the "Opportunity Cost" of daily spending. |
| 12 | `budget_simulations` | Intelligence | The "What-If" sandbox. A safe space for the AI to model potential purchases and their impact on goals without affecting real balances. |
| 13 | `strategic_recommendations` | Intelligence | The "Proactive Pilot." A queue of AI-generated advice. It uses snooze logic to ensure the user feels guided, not nagged. |
| 14 | `recurring_expenses` | Core Master Data | The "Automation Engine." Templates for indefinite recurring payments (Utilities, Subscriptions) used for matching and projections. |

---

## 4. Detailed Column Dictionary

### Table 1: `categories`
* **`id`** (INTEGER, PK): Unique identifier.
* **`code`** (TEXT, UNIQUE): Machine-readable slug (e.g., `groceries`). **Use for logic.**
* **`label`** (TEXT): Human-readable display name (e.g., `Groceries & Mart`).
* **`icon_name`** (TEXT): Identifier for the UI icon (e.g., `shopping-cart`).
* **`color_code`** (TEXT): Hex code for charting (e.g., `#4ade80`).
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.

---

### Table 2: `wallets`
* **`id`** (INTEGER, PK): Unique identifier.
* **`name`** (TEXT): Display name (e.g., `Amore Cashback`).
* **`provider_id`** (INTEGER, FK): References `providers.id`.
* **`color`** (TEXT): User-selected hex color code (e.g., `#3b82f6`).
* **`type`** (TEXT): `credit`, `debit`, or `cash`.
* **`balance`** (REAL): Current debt (for Credit) or Cash (for Debit/Cash).
* **`available_credit`** (REAL): Total swiping power remaining (Limit minus total debt).
* **`credit_limit`** (REAL): The hard limit assigned by the bank.
* **`cycle_day`** (INTEGER): Statement cut-off day (e.g., `26`).
* **`due_day`** (INTEGER): Payment deadline day (e.g., `15`).
* **`monthly_cashback_limit`** (REAL): Max rewards per month (e.g., `1500.0`).
* **`cashback_ytd`** (REAL): Year-to-date total rewards earned.
* **`benefits`** (TEXT): **DEPRECATED.** Use `wallet_benefits` table instead. Legacy JSON string of category multipliers.
* **`version`** (INTEGER): Incremental counter for optimistic locking.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.

---

### Table 2b: `wallet_benefits`
* **`id`** (INTEGER, PK): Unique identifier.
* **`wallet_id`** (INTEGER, FK): References `wallets.id`. Cascade deletes when wallet is removed.
* **`category_id`** (INTEGER, FK): References `categories.id`. Links benefit to specific spending category.
* **`benefit_type`** (TEXT): Type of benefit - `cashback` for credit cards, `interest` for debit cards.
* **`rate`** (REAL): Percentage rate. For credit cards: cashback % (e.g., `4.0` = 4%). For debit cards: interest rate % (e.g., `2.5` = 2.5% APY).
* **`is_active`** (BOOLEAN): Whether this benefit is currently active. Allows temporary disabling without deletion.
* **`effective_from`** (TEXT): ISO8601 date when benefit starts. NULL = active immediately.
* **`effective_until`** (TEXT): ISO8601 date when benefit ends. NULL = indefinite.
* **`notes`** (TEXT): Optional details about promo conditions, restrictions, etc.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.

**Strategic Usage:**
- **Credit Cards**: Use `benefit_type='cashback'` to store category-specific reward rates.
- **Debit Cards**: Use `benefit_type='interest'` to store category-specific interest rates (e.g., higher rates for savings categories).
- **Time-Bound Promos**: Set `effective_from` and `effective_until` for limited-time offers.
- **Card Recommendations**: Query active benefits WHERE `is_active=1` AND date is within effective range to find optimal card for each category.

---

### Table 3: `income_sources`
* **`id`** (INTEGER, PK): Unique identifier.
* **`name`** (TEXT): Name of the source (e.g., 'Company Salary').
* **`provider`** (TEXT): The entity paying the user.
* **`category`** (TEXT): Type of income (`salary`, `side_hustle`, etc.).
* **`frequency`** (TEXT): `monthly`, `bi-weekly`, `weekly`, `sporadic`.
* **`is_active`** (BOOLEAN): Whether this source is currently active.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 4: `transaction_headers`
* **`id`** (INTEGER, PK): Unique identifier.
* **`wallet_id`** (INTEGER, FK): References `wallets.id`.
* **`merchant`** (TEXT): The seller name.
* **`transaction_date`** (TEXT): The actual date of purchase (ISO8601).
* **`total_amount`** (REAL): Full purchase price.
* **`payment_type`** (TEXT): `straight` or `installment`.
* **`description`** (TEXT): General note.
* **`executed_by`** (TEXT): `user` or `ai`.
* **`confidence_score`** (REAL): OCR/AI certainty (0.0 to 1.0).
* **`needs_review`** (BOOLEAN): Flag for manual human verification.
* **`status`** (TEXT): `posted`, `pending`, `cancelled`.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 5: `transaction_details`
* **`id`** (INTEGER, PK): Unique identifier.
* **`header_id`** (INTEGER, FK): References `transaction_headers.id`.
* **`category_id`** (INTEGER, FK): References `categories.id`.
* **`description`** (TEXT): Specific item detail.
* **`line_amount`** (REAL): Portion of the total for this category.
* **`billing_date`** (TEXT): **CRITICAL.** When this hits the budget/statement.
* **`installments_total`** (INTEGER): Total months for the plan.
* **`installment_number`** (INTEGER): Current payment index.
* **`cashback_earned`** (REAL): Rewards calculated for this line.
* **`status`** (TEXT): `upcoming`, `billed`, `paid`.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 6: `income_transactions`
* **`id`** (INTEGER, PK): Unique identifier.
* **`source_id`** (INTEGER, FK): References `income_sources.id`.
* **`wallet_id`** (INTEGER, FK): References `wallets.id`.
* **`amount`** (REAL): Net amount received.
* **`date`** (TEXT): ISO8601 date of deposit.
* **`executed_by`** (TEXT): `user` or `buddy`.
* **`reference_no`** (TEXT): Bank/Transfer reference ID.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 7: `wallet_ledger`
* **`id`** (INTEGER, PK): Unique identifier.
* **`wallet_id`** (INTEGER, FK): References `wallets.id`.
* **`entry_type`** (TEXT): `DEBIT` or `CREDIT`.
* **`amount`** (REAL): The change amount.
* **`previous_balance`** (REAL): Balance before change.
* **`new_balance`** (REAL): Balance after change.
* **`reason`** (TEXT): Explanation (e.g., 'Transaction Sync').
* **`created_at`** (TIMESTAMP): Time of logging.
---
### Table 8: `wallet_cashback_history`
* **`id`** (INTEGER, PK): Unique identifier.
* **`wallet_id`** (INTEGER, FK): References `wallets.id`.
* **`month_year`** (TEXT): 'YYYY-MM'.
* **`amount_earned`** (REAL): Total cashback earned in this period.
* **`monthly_limit`** (REAL): Snapshot of the wallet's limit at that time.
* **`is_capped`** (BOOLEAN): Flag if the limit has been hit.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 9: `monthly_budgets`
* **`id`** (INTEGER, PK): Unique identifier.
* **`category_id`** (INTEGER, FK): Links to `categories.id`.
* **`month_year`** (TEXT): Format 'YYYY-MM'.
* **`amount`** (REAL): Maximum spending limit.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 10: `chat_logs`
* **`id`** (INTEGER, PK): Unique identifier.
* **`session_id`** (TEXT): Conversation thread ID.
* **`sender`** (TEXT): `user` or `buddy`.
* **`message`** (TEXT): Content.
* **`feedback`** (TEXT): `up`, `down`, or `NULL`.
* **`metadata`** (JSON): Context, tools used, logic scores.
* **`timestamp`** (TIMESTAMP): Message time.

### Table 11: `savings_goals`
* **`id`** (INTEGER, PK): Unique identifier.
* **`name`** (TEXT): Goal name (e.g., `Japan Trip`).
* **`target_amount`** (REAL): Final target.
* **`current_amount`** (REAL): Funds allocated so far.
* **`deadline`** (TEXT): ISO8601 target date.
* **`status`** (TEXT): `active`, `completed`, `paused`.
* **`priority_level`** (INTEGER): `1` (High) to `5` (Low).
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.
---
### Table 12: `budget_simulations`
* **`id`** (INTEGER, PK): Unique identifier.
* **`wallet_id`** (INTEGER, FK): The wallet being tested.
* **`category_id`** (INTEGER, FK): The category being tested.
* **`simulated_amount`** (REAL): Hypothetical cost.
* **`payment_type`** (TEXT): `straight` or `installment`.
* **`urgency`** (TEXT): `need_now`, `can_wait`.
* **`linked_goal_id`** (INTEGER, FK): Impact on specific `savings_goals`.
* **`recommendation`** (TEXT): AI verdict (`Go`, `No-Go`, `Wait`).
* **`pilot_reasoning`** (TEXT): The "Why" behind the verdict.
* **`impact_on_balance`** (REAL): Projected balance.
* **`confidence_score`** (REAL): AI's certainty (0.0 to 1.0).
* **`created_at`** (TIMESTAMP): Simulation timestamp.
---
### Table 13: `strategic_recommendations`
* **`id`** (INTEGER, PK): Unique identifier.
* **`title`** (TEXT): Summary of advice.
* **`message`** (TEXT): Full context.
* **`urgency_level`** (TEXT): `low`, `medium`, `high`, `critical`.
* **`status`** (TEXT): `pending`, `dismissed`, `snoozed`, `acted_upon`.
* **`reminder_frequency`** (TEXT): `daily`, `weekly`, `bi-weekly`.
* **`remind_at`** (TIMESTAMP): Next notification time.
* **`created_at`** (TIMESTAMP): Recommendation creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.

---

### Table 14: `recurring_expenses`
* **`id`** (INTEGER, PK): Unique identifier.
* **`name`** (TEXT): Display name (e.g., `Meralco Bill`).
* **`category_id`** (INTEGER, FK): Links to `categories.id`.
* **`default_wallet_id`** (INTEGER, FK): Preferred payment method.
* **`amount_estimate`** (REAL): Expected cost for matching logic.
* **`frequency`** (TEXT): `daily`, `weekly`, `bi-weekly`, `monthly`, `quarterly`, `yearly`.
* **`day_of_month`** (INTEGER): Expected billing day (1-31).
* **`is_active`** (BOOLEAN): Whether this automation is running.
* **`created_at`** (TIMESTAMP): Record creation time.
* **`updated_at`** (TIMESTAMP): Last modification time.

---

## 5. Trigger Logic Flow (Automated Side Effects)

1. **`trg_*_updated_at`**:
   - **Trigger:** `AFTER UPDATE` on almost all master and transactional tables.
   - **Effect:** Automatically sets `updated_at = CURRENT_TIMESTAMP`.

2. **`sync_balance_on_transaction`**:
   - **Trigger:** `AFTER INSERT ON transaction_headers`.
   - **Effect:** Increases `wallets.balance` (debt/spending) and decreases `wallets.available_credit` (if credit). Increments `wallets.version`.

3. **`sync_balance_on_income`**:
   - **Trigger:** `AFTER INSERT ON income_transactions`.
   - **Effect:** 
     - Credit Wallet: Decreases `balance` (pays debt), increases `available_credit`.
     - Debit/Cash Wallet: Increases `balance` (adds savings).
     - Increments `wallets.version`.

4. **`audit_wallet_balance_update`**:
   - **Trigger:** `AFTER UPDATE OF balance ON wallets`.
   - **Effect:** Logs entries into `wallet_ledger` with `entry_type`, `amount`, `previous_balance`, and `new_balance`.

5. **`manage_cashback_and_history`**:
   - **Trigger:** `AFTER INSERT ON transaction_details`.
   - **Effect:** 
     - Ensures a bucket exists in `wallet_cashback_history` for the current month.
     - Updates `amount_earned` while respecting the `monthly_limit`.
     - Flags `is_capped` if the limit is reached.
     - Updates `wallets.cashback_ytd`.

6. **`match_transaction_to_recurring`**:
   - **Trigger:** `AFTER INSERT ON transaction_details`.
   - **Effect:** Searches for a record in `recurring_expenses` with the same `category_id` and an amount within +/- 10% tolerance. If found, appends `[Matched Recurring: Name]` to the transaction description.

---

## 6. Operational Logic (Agent Knowledge)

- **The Truth Check:** Net Worth = (Sum of Debit/Cash `balance`) - (Sum of Credit `balance`).
- **Optimization:** Recommend cards based on `wallet_benefits` table. Query for `max(rate)` WHERE `benefit_type='cashback'` AND `is_active=1` AND `category_id` matches transaction AND date is within effective range. Exclude cards where `is_capped=1` in `wallet_cashback_history`.
- **The "No-Pressure" Rule:** For any recommendation snoozed by the user, update `remind_at` to `+3 days` (Nudge) or `+5 days` (Review).

## 7. Metadata Mapping

| Category ID | Code | High-Value Card | Reason |
| :--- | :--- | :--- | :--- |
| 1 | `groceries` | Amore (ID 1) | 4% Cashback |
| 2 | `dining` | EastWest (ID 2) | 5% Cashback |
| 3 | `transport` | EastWest (ID 2) | 5% Cashback |
| 4 | `subscriptions` | EastWest (ID 2) | 5% Cashback |
| 5 | `shopping` | Amore (ID 1) | 1% Base + Limit check |
| 6 | `utilities` | BDO Debit (ID 3) | Direct cash flow impact |
| 4 | `subscriptions` | Amore (ID 1) | Fixed monthly spend |