# 💳 Wallets: Managing Your Money Sources

The Wallets module is where you manage your Credit Cards, Debit Cards, and E-Wallets. It tracks your balances and tells you when your bills are due.

## 🔄 The Full-Stack Flow

```mermaid
graph TD
    User([User Adds Card]) --> UI[modals.ts: create_wallet]
    UI --> BE[api.py: POST /api/wallets]
    BE --> DB[(SQLite: wallets table)]
    DB --> Sync[state.ts: refresh()]
    Sync --> UI2[wallets.ts: renderWallets]
```

---

## 🏗️ 1. Database Layer (The Source)
Wallets are the most complex data structures in the app. They use three tables:
- **`wallets`**: The main card info (Name, Limit, Type, Color).
- **`providers`**: The bank info (BPI, BDO, GCash) and their logos.
- **`wallet_benefits`**: The specific cashback % for each category (e.g., 5% on Dining).

## ⚙️ 2. Backend Layer (The Controller)
The backend calculates your **Utilization %** automatically by checking your spending vs. your credit limit.

**File: `app/routers/api.py`**
```python
@router.get("/state")
async def get_app_state(db: Connection):
    # Joins Wallets with Providers to get logos and names
    wallets = db.execute("""
        SELECT w.*, p.name as provider_name 
        FROM wallets w
        LEFT JOIN providers p ON w.provider_id = p.id
    """).fetchall()
```

## 🧠 3. State Layer (The Sync)
The state layer "enriches" the wallets by adding UI-friendly properties like icons and colors.

**File: `frontend/src/state.ts`**
```typescript
this.cards = data.wallets.map(w => ({
    ...w,
    color: w.color || '#3b82f6', // Use the user's custom color!
    icon: w.type === 'credit' ? 'credit-card' : 'wallet',
}));
```

## 🎨 4. Frontend Layer (The UI)
The `wallets.ts` module renders the beautiful cards and calculates if it's a "Great Time to Spend" based on your billing cycle.

**File: `frontend/src/modules/wallets.ts`**
```typescript
const cycle = getCycleStatus(card.cycleDate);
// UI shows a green badge if you are in the "Golden Window" 
// (just after your statement date!)
```

---

> [!TIP]
> **Strategic Timing**: Spending right after your Statement Date gives you up to **45+ days** to pay your bill interest-free. The Wallets module highlights this "Golden Window" for you!
