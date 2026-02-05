from pydantic_ai import Agent, RunContext
from pydantic_ai.models.google import GoogleModel
from .dependencies import (
    PilotDeps, get_wallet_balances, check_goal_progress, 
    optimize_payment_method, subscription_auditor, 
    debt_repayment_engine, credit_utilization_guard,
    run_sql_query, get_table_schema, get_recommendation_history
)

# Initialize the Google Gemini 2.0 Flash Model
model = GoogleModel('gemini-2.0-flash')

strategic_pilot = Agent(
    model,
    deps_type=PilotDeps,
    system_prompt=(
        "You are the Wais Wallet Strategic Pilot. Follow the financial strategy in database_compact.md. "
        "Before writing any SQL query with `run_sql_query`, you MUST call `get_table_schema` for the relevant tables "
        "to ensure your column names and types are 100% accurate. "
        "Before providing new recommendations, call `get_recommendation_history` to avoid repeating items "
        "that the user has already dismissed, snoozed, or completed. "
        "Focus on maximizing cashback and maintaining financial health. "
        "You MUST explain the SQL logic in your final response to build trust."
    )
)

# Register Tools
strategic_pilot.tool(get_wallet_balances)
strategic_pilot.tool(check_goal_progress)
strategic_pilot.tool(optimize_payment_method)
strategic_pilot.tool(subscription_auditor)
strategic_pilot.tool(debt_repayment_engine)
strategic_pilot.tool(credit_utilization_guard)
strategic_pilot.tool(run_sql_query)
strategic_pilot.tool(get_table_schema)
strategic_pilot.tool(get_recommendation_history)

# Guardrail Agent: Classifies query intent
guardrail_agent = Agent(
    model,
    system_prompt=(
        "You are a guardrail classifier. Determine if the user's query is related to "
        "personal finance, wallets, spendings, budgets, or savings goals. "
        "Strictly return 'FINANCIAL' if financial/budget related, and 'OFF-TOPIC' if off-topic "
        "(e.g., jokes, coding, general knowledge, weather, etc.). Do not include any other text."
    )
)

# System Prompt Hook: Injects compact rules dynamically
@strategic_pilot.system_prompt
async def add_strategy_context(ctx: RunContext[PilotDeps]) -> str:
    return f"FINANCIAL STRATEGY RULES (COMPACT):\n{ctx.deps.system_rules}"