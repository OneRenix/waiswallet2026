# 🤖 WaisWallet Intelligence: The AI Chat Guide

This guide explains how WaisWallet's "Strategic Pilot" works—from the moment you type a message to the AI's deep analysis of your actual database.

---

## 🏗️ The Multi-Agent Architecture

WaisWallet doesn't just use a single chatbot; it uses a **Duel-Agent System** powered by **Gemini 2.0 Flash**.

### 1. The Sentinel (Guardrail Agent)
Before your question even reaches the "Brain," it passes through a security layer.
- **Role**: Intent Classifier.
- **Logic**: It determines if your question is **FINANCIAL** (relevant) or **OFF-TOPIC** (jokes, weather, general knowledge).
- **Result**: If off-topic, it politely refuses to answer, saving processing power and keeping the co-pilot focused on your wealth.

### 2. The Brain (Strategic Pilot)
The core "intelligence" that processes your financial data.
- **Engine**: Gemini 2.0 Flash (Optimized for speed and complex multi-step reasoning).
- **Behavior**: It uses **ReAct logic** (Reasoning + Acting). It thinks about what you asked, decides which tools to use, and then acts.

---

## 🛠️ The Strategic Toolkit

The Strategic Pilot is "Grounded" in your real data. It has access to professional tools that it calls dynamically:

| Tool | Capability |
| :--- | :--- |
| **run_sql_query** | Directly queries your `waiswallet.db` to get real-time numbers. |
| **optimize_payment_method** | Suggests the best card to use for a specific purchase to maximize cashback. |
| **subscription_auditor** | Scans your transactions for recurring bills and identifies potential savings. |
| **check_goal_progress** | Compares your current savings vs. your target goals (e.g., Japan Trip). |
| **get_table_schema** | Allows the AI to "see" your database structure to write perfect-accuracy SQL. |

---

## 🚀 The Data Journey

1.  **Frontend**: You type into the chat modal or the dashboard search bar.
2.  **Transporter**: The Javascript sends the text to the Python backend at `POST /chat/`.
3.  **Processing**:
    -   Backend loads `database_compact.md` (the "Financial Strategy Book").
    -   Guardrail checks the intent.
    -   Strategic Pilot calls the necessary tools (SQL, Balances, etc.).
4.  **Delivery**: The AI's response is sent back, including an explanation of its logic and any SQL it used.

---

## 🛡️ Trust & Transparency

A core feature of WaisWallet is **Explainable AI**. The Strategic Pilot is instructed to:
- Explain **why** it gave a certain recommendation.
- Show the **SQL Logic** it used to calculate your balances or expenses.
- Cross-reference with your **Strategic History** to avoid repetitive advice.

---

## 🎨 Customizing the Co-Pilot

If you want to change how WaisWallet thinks or speaks, you can edit these files:

### 1. **Personality & ReAct Logic**
*   **File**: [app/agents/pilot.py](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/agents/pilot.py)
*   **What to edit**: 
    - `system_prompt` (Line 16): Change the tone or core operational rules.
    - `guardrail_agent` (Line 41): Adjust what the sentinel considers "off-topic."

### 2. **The Knowledge Base (Strategy)**
*   **File**: [app/data/database_compact.md](file:///Users/ultrenzv/Documents/DEV/waiswallet/app/data/database_compact.md)
*   **What to edit**: 
    - This is the "Brain" of the AI. Update this to change the financial rules, card strategy priorities, or table details that the AI knows about.

---

> [!TIP]
> **Try this query:** 
> *"Show me my biggest credit card bill this month and suggest a repayment strategy."*
> You'll see the Pilot run a query, check your card cycle, and give you a step-by-step plan!
