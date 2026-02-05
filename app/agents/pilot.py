from pydantic_ai import Agent, RunContext
from pydantic_ai.models.gemini import GeminiModel
from .dependencies import (
    PilotDeps, get_wallet_balances, check_goal_progress, 
    optimize_payment_method, subscription_auditor, 
    debt_repayment_engine, credit_utilization_guard,
    run_sql_query
)

# Initialize the Gemini 2.0 Flash Model
# Note: Ensure GOOGLE_API_KEY is set in your .env
model = GeminiModel('gemini-2.0-flash')

strategic_pilot = Agent(
    model,
    deps_type=PilotDeps,
    system_prompt=(
        "You are the Wais Wallet Strategic Pilot. Follow the financial strategy in database.md. "
        "When using the `run_sql_query` tool, you MUST explain the SQL logic in your final response to build trust."
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

# System Prompt Hook: Injects database.md rules dynamically
@strategic_pilot.system_prompt
async def add_strategy_context(ctx: RunContext[PilotDeps]) -> str:
    return f"FINANCIAL STRATEGY RULES:\n{ctx.deps.system_rules}"