from fastapi import APIRouter, Depends, HTTPException
from sqlite3 import Connection
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception
from ..db.connection import get_db_session
from ..agents.pilot import strategic_pilot, PilotDeps

router = APIRouter(prefix="/chat", tags=["Chatbot"])

def is_rate_limit_error(exception):
    """Check if the exception is a 429 Resource Exhausted error."""
    return "429" in str(exception) or "RESOURCE_EXHAUSTED" in str(exception)

@retry(
    wait=wait_exponential(multiplier=2, min=5, max=30),
    stop=stop_after_attempt(5),
    retry=retry_if_exception(is_rate_limit_error),
    reraise=True
)
async def run_agent_with_retry(query: str, deps: PilotDeps):
    return await strategic_pilot.run(query, deps=deps)

@router.post("/")
async def chat_with_pilot(query: str, db: Connection = Depends(get_db_session)):
    # 1. Load the "Financial Brain" context
    with open("app/data/database.md", "r") as f:
        rules = f.read()
    
    # 2. Package Dependencies
    deps = PilotDeps(db=db, system_rules=rules)
    
    # 3. Run the Agent (Gemini 2.0 Flash handles the ReAct logic)
    try:
        result = await run_agent_with_retry(query, deps)
        
        # Robust extraction of response text
        response_text = result.data if hasattr(result, 'data') else str(result)
        
        # If it somehow still has the AgentRunResult wrapper, strip it
        if isinstance(response_text, str) and response_text.startswith("AgentRunResult("):
            import re
            match = re.search(r'output=["\'](.*?)["\']', response_text, re.DOTALL)
            if match:
                response_text = match.group(1).replace("\\n", "\n")

        # Extract tool calls for visibility in usage/logs
        tool_calls = []
        for msg in result.all_messages():
            if hasattr(msg, 'parts'):
                for part in msg.parts:
                    if 'ToolCall' in type(part).__name__:
                        tool_calls.append({
                            "tool": getattr(part, 'tool_name', 'unknown'), 
                            "args": getattr(part, 'args', {})
                        })
        
        return {
            "response": response_text,
            "tool_calls": tool_calls,
            "usage": result.usage() if hasattr(result, 'usage') else {}
        }
    except Exception as e:
        print(f"Error after retries in chat_with_pilot: {e}")
        raise HTTPException(status_code=500, detail=str(e))