from pydantic_ai import Agent, RunContext
from pydantic_ai.models.google import GoogleModel, GoogleModelSettings
from .dependencies import PilotDeps, run_sql_query
from .pilot import sql_agent, provider
from pydantic import BaseModel, Field
from typing import List

# Use a fast lite model for simulations
model_sim = GoogleModel('gemini-2.0-flash-lite',
    provider=provider,
    settings=GoogleModelSettings(temperature=0.2)
)

class SimulationResult(BaseModel):
    score: int = Field(description="Wais Score (0-100)")
    is_affordable: bool = Field(description="Whether the user can actually afford this based on credit/cash")
    recommendation: str = Field(description="A critical, detailed explanation of why this is a good or bad move, including specific financial impact.")
    best_strategy: str = Field(description="A specific, actionable strategy for the user (e.g., 'Use Card X on Jan 5th instead', or 'Save ₱5000/mo for 4 months').")
    pro_tips: List[str] = Field(description="Strategic tips regarding billing cycles, rewards, or debt management.")
    monthly_impact: float = Field(description="The calculated monthly cost for the user.")

simulation_agent = Agent(
    model_sim,
    deps_type=PilotDeps,
    output_type=SimulationResult,
    system_prompt=(
        "You are the Wais Wallet Financial Navigator and Critic. Your goal is to provide a HIGH-DENSITY, "
        "CRITICAL analysis of a hypothetical purchase. \n"
        "PERSONA:\n"
        "- Act as a strategic co-pilot but also a firm financial critic.\n"
        "- Do NOT be generic. Use specific numbers and database context.\n"
        "- Prioritize long-term financial stability over rewards or convenience.\n"
        "RULES:\n"
        "1. DATA: Use the provided DATABASE_CONTEXT to understand the schema. Only use `ask_database` to fetch ACTUAL balances, limits, and trends.\n"
        "2. ANALYSIS: In your `recommendation`, explain the EXACT trade-off. (e.g., 'This purchase will consume 40% of your remaining credit limit and increase your monthly obligations by ₱2,000 for 6 months').\n"
        "3. STRATEGY: In `best_strategy`, provide a better alternative if current plan is weak. Suggest optimal payment dates, different cards, or 'Wait and Save' goals.\n"
        "4. SCORING:\n"
        "   - 85-100: Responsible, high cash flow, low utilization.\n"
        "   - 60-84: Needs caution—lifestyle inflation or debt risk detected.\n"
        "   - 0-59: Risky/Irresponsible (debt spiral risks, exceeding limits, or poor timing).\n"
        "5. TONE: Sharp, intellectual, professional, and brutally honest about financial health."
    )
)

@simulation_agent.system_prompt
def add_schema_context(ctx: RunContext[PilotDeps]) -> str:
    """Inject the compact database schema context to reduce exploratory tool calls."""
    try:
        with open("app/data/database_compact.md", "r") as f:
            return f"DATABASE_CONTEXT:\n{f.read()}"
    except FileNotFoundError:
        with open("data/database_compact.md", "r") as f:
            return f"DATABASE_CONTEXT:\n{f.read()}"

@simulation_agent.system_prompt
async def add_strategy_context(ctx: RunContext[PilotDeps]) -> str:
    """Inject strategic rules into the simulation agent."""
    return f"FINANCIAL STRATEGY RULES:\n{ctx.deps.system_rules}"

@simulation_agent.tool
async def ask_database(ctx: RunContext[PilotDeps], question: str) -> str:
    """Use this tool to fetch current financial data to contextualize the simulation."""
    result = await sql_agent.run(question, deps=ctx.deps)
    
    # Handle different PydanticAI versions or return types
    if hasattr(result, 'data'):
        return result.data
    elif hasattr(result, 'output'):
        return result.output
    else:
        return str(result)
