from pydantic_ai import Agent, RunContext
import os
from pydantic_ai.models.google import GoogleModel, GoogleModelSettings
from .dependencies import (
    PilotDeps, run_sql_query, get_table_schema, add_transaction, add_recommendation
)
from .prompt_versions import get_prompt

from dotenv import load_dotenv

from pydantic_ai.providers.google import GoogleProvider

# Load environment variables early
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    print(f"API Key Diagnostic: Initializing provider with key starting with {api_key[:4]}...")
    provider = GoogleProvider(api_key=api_key)
else:
    provider = 'google-gla' # Fallback to default behavior

# Initialize the Google Gemini 2.0 Flash Model (Lite for speed)
model_main = GoogleModel('gemini-2.0-flash-lite',
    provider=provider,
    settings=GoogleModelSettings(
        google_thinking_config={'thinking_budget': 2048}, # The "Wais" reasoning limit
        temperature=0.1, # Keep it deterministic for SQL generation
        max_tokens=4096   # Enforce your <50 words constraint
    )
)
model_guardrails = GoogleModel('gemini-2.0-flash-lite', provider=provider)
model_sql = GoogleModel('gemini-2.0-flash-lite',
    provider=provider,
    settings=GoogleModelSettings(temperature=0.0) # Strict SQL generation
)

# Load the optimal prompt version (v1_baseline - Modified)
prompt_config = get_prompt("v1_baseline")

# --- SQL SCOUT AGENT ---
sql_agent = Agent(
    model_sql,
    deps_type=PilotDeps,
    system_prompt=(
        "You are a SQL Scout. Your ONLY job is to generate and execute SQLite queries based on the user's request. "
        "RULES: \n"
        "1. READ-ONLY: Use ONLY SELECT statements. No INSERT/UPDATE/DELETE.\n"
        "2. SCHEMA: You have access to the database schema. Check it before querying.\n"
        "3. LIMIT: Always limit results to 50 rows.\n"
        "4. OUTPUT: Return the raw data or a clear message if no data found."
    )
)

@sql_agent.system_prompt
def add_schema_context(ctx: RunContext[PilotDeps]) -> str:
    # Use path relative to project root or use absolute path logic if needed
    # Assuming running from root
    try:
        with open("app/data/database_compact.md", "r") as f:
            return f"DATABASE_CONTEXT:\n{f.read()}"
    except FileNotFoundError:
        # Fallback for when running inside app module
        with open("data/database_compact.md", "r") as f:
            return f"DATABASE_CONTEXT:\n{f.read()}"

# Register Tools for SQL Agent
sql_agent.tool(run_sql_query)
sql_agent.tool(get_table_schema)


# --- MAIN STRATEGIC PILOT ---
strategic_pilot = Agent(
    model_main,
    deps_type=PilotDeps,
    system_prompt=prompt_config.system_prompt
)

@strategic_pilot.tool
async def ask_database(ctx: RunContext[PilotDeps], question: str) -> str:
    """Use this tool to fetch financial data from the database. Pass a natural language question describing the data you need."""
    # Run the SQL agent
    # We pass the same dependencies to the sub-agent
    result = await sql_agent.run(question, deps=ctx.deps)
    
    # Handle different PydanticAI versions or return types
    if hasattr(result, 'data'):
        return result.data
    elif hasattr(result, 'output'):
        return result.output
    else:
        return str(result)

# Register Tools for Main Pilot (NO direct SQL tools)
strategic_pilot.tool(add_transaction)
strategic_pilot.tool(add_recommendation)
# strategic_pilot.tool(run_sql_query) # REMOVED: Delegated to sql_agent
# strategic_pilot.tool(get_table_schema) # REMOVED: Delegated to sql_agent

# Guardrail Agent: Classifies query intent
guardrail_agent = Agent(
    model_guardrails,
    system_prompt=(
        "You are a guardrail classifier. Determine if the user's query is related to "
        "personal finance, spending priorities, lifestyle choices affecting budget, or savings goals. "
        "IMPORTANT: Reasoning about *why* a user wants to buy something (e.g., 'current phone is slow') is part of a financial discussion about priorities. "
        "Strictly return 'FINANCIAL' if related to money, spending, or budgeting (including priorities), "
        "and 'OFF-TOPIC' ONLY if completely unrelated (e.g., jokes, coding, weather). "
        "Do not include any other text."
    )
)

# System Prompt Hook: Injects compact rules dynamically
@strategic_pilot.system_prompt
async def add_strategy_context(ctx: RunContext[PilotDeps]) -> str:
    rules = f"FINANCIAL STRATEGY RULES (COMPACT):\n{ctx.deps.system_rules}"
    
    if ctx.deps.is_new_session:
        rules += "\n\nCONTEXT: This is the user's first message in this session. Start your response with a short, witty, and friendly greeting welcoming them back to Wais Wallet."
        
    return rules