# 🧠 Wais Wallet: AI-Powered Financial Pilot

Wais Wallet is a strategic financial management system designed for the "Wais" (smart) user. It combines a structured SQLite database with a Gemini-powered AI agent to provide proactive financial advice, cashback optimization, and automated expense tracking.

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.12+
- `uv` (recommended for dependency management)
- Google API Key (for Gemini 2.0 Flash)

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
GOOGLE_API_KEY=your_api_key_here
DATABASE_PATH=app/data/waiswallet.db
```

### 3. Initialize the Database
> [!IMPORTANT]
> Always run commands from the project root directory (`waiswallet/`).

Before running the app, set up the schema and sample data:
```bash
uv run app/data/initialize/initialiize_db.py
```

## 🛠️ Running the Application

### Manual Testing (Standalone Script)
To test the AI logic without starting the server, use the provided test client:
```bash
uv run test_api.py
```
This script uses `FastAPI TestClient` to simulate requests to the `/chat/` endpoint and prints the agent's response, tool usage, and SQL query logs.

### Start the FastAPI Server
To run the full API with hot-reload:
```bash
uv run uvicorn app.main:app --reload
```

## 📁 Project Structure
- `app/main.py`: FastAPI application entry point.
- `app/routers/chat.py`: The AI Chat endpoint integration.
- `app/agents/`:
    - `pilot.py`: AI Agent registration and system prompt.
    - `dependencies.py`: ReAct tools for financial analysis (with SQL logging).
- `app/db/connection.py`: Database connection layer with environment support.
- `app/data/`:
    - `database.md`: The "Financial Brain" (Rules & Data Dictionary).
    - `initialize/`: SQL scripts for schema, triggers, and seed data.
- `test_api.py`: Standalone script for manual logic testing.

## 🤖 AI Strategic Tools
- **Optimize Payment Method**: Recommends the best wallet (BPI Amore vs EastWest Visa) based on rewards.
- **Subscription Auditor**: Checks `recurring_expenses` for missing or double payments.
- **Debt Repayment Engine**: Suggests optimized payment plans for credit card balances.
- **Credit Utilization Guard**: Monitors utilization ratios to protect credit scores.
