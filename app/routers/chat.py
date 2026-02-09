from fastapi import APIRouter, Depends, HTTPException
from sqlite3 import Connection
from typing import Optional, List
from pydantic import BaseModel
from pydantic_ai.messages import ModelRequest, ModelResponse, UserPromptPart, TextPart
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception
from ..db.connection import get_db_session
from ..agents.pilot import strategic_pilot, guardrail_agent, PilotDeps

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default_session"

def is_rate_limit_error(exception):
    """Check if the exception is a 429 Resource Exhausted error."""
    return "429" in str(exception) or "RESOURCE_EXHAUSTED" in str(exception)

@retry(
    wait=wait_exponential(multiplier=2, min=5, max=30),
    stop=stop_after_attempt(5),
    retry=retry_if_exception(is_rate_limit_error),
    reraise=True
)
async def run_agent_with_retry(query: str, deps: PilotDeps, message_history: List = None):
    # Enforce a tool loop cap of 20 steps to prevent infinite loops
    # Note: 'max_steps' is not supported in this version of pydantic-ai. 
    # relying on default or Agent configuration.
    return await strategic_pilot.run(query, deps=deps, message_history=message_history)

def get_history(db: Connection, session_id: str, limit: int = 3):
    """Fetches last N messages for a session and converts to Pydantic AI format."""
    cursor = db.cursor()
    cursor.execute("""
        SELECT sender, message FROM chat_logs 
        WHERE session_id = ? 
        ORDER BY timestamp ASC LIMIT ?
    """, (session_id, limit))
    rows = cursor.fetchall()
    
    history = []
    for row in rows:
        sender, message = row['sender'], row['message']
        if sender == 'user':
            history.append(ModelRequest(parts=[UserPromptPart(content=message)]))
        else:
            history.append(ModelResponse(parts=[TextPart(content=message)]))
    return history

def save_log(db: Connection, session_id: str, sender: str, message: str):
    """Saves a message to the chat_logs table."""
    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO chat_logs (session_id, sender, message)
            VALUES (?, ?, ?)
        """, (session_id, sender, message))
        db.commit()
    except Exception as e:
        print(f"Failed to save chat log: {e}")

@router.delete("/reset")
async def reset_chat_history(session_id: Optional[str] = "default_session", db: Connection = Depends(get_db_session)):
    """Clears the chat history for a session."""
    try:
        cursor = db.cursor()
        cursor.execute("DELETE FROM chat_logs WHERE session_id = ?", (session_id,))
        db.commit()
        return {"status": "success", "message": f"History for session '{session_id}' cleared."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def chat_with_pilot(request: ChatRequest, db: Connection = Depends(get_db_session)):
    query = request.query
    session_id = request.session_id

    # 1. Load History & Rules
    message_history = get_history(db, session_id)
    with open("app/data/database_compact.md", "r") as f:
        rules = f.read()

    # 0. Fast Intent Check (Guardrail) - Context Aware
    try:
        classifier_result = await guardrail_agent.run(query, message_history=message_history)
        classifier_output = str(getattr(classifier_result, 'output', classifier_result))
        
        if "OFF-TOPIC" in classifier_output.upper():
            return {
                "response": "I'm sorry, but I can only assist with personal finance, budgeting, and savings-related questions. How can I help you with your wealth today?",
                "tool_calls": [],
                "usage": classifier_result.usage()
            }
    except Exception as e:
        print(f"Guardrail check failed: {e}")
        pass
    
    # 2. Package Dependencies
    is_new_session = len(message_history) == 0
    deps = PilotDeps(db=db, system_rules=rules, is_new_session=is_new_session)
    
    # 3. Run the Agent
    try:
        result = await run_agent_with_retry(query, deps, message_history=message_history)
        response_text = result.output if hasattr(result, 'output') else str(result)
        
        # Strip potential wrapper
        if isinstance(response_text, str) and response_text.startswith("AgentRunResult("):
            import re
            match = re.search(r'output=["\'](.*?)["\']', response_text, re.DOTALL)
            if match:
                response_text = match.group(1).replace("\\n", "\n")

        # Extract tool calls
        tool_calls = []
        for msg in result.all_messages():
            if hasattr(msg, 'parts'):
                for part in msg.parts:
                    if 'ToolCall' in type(part).__name__:
                        tool_calls.append({
                            "tool": getattr(part, 'tool_name', 'unknown'), 
                            "args": getattr(part, 'args', {})
                        })
        
        # 4. Save to Chat Logs
        save_log(db, session_id, "user", query)
        save_log(db, session_id, "buddy", response_text)

        # Terminal Logging
        usage = result.usage()
        print(f"\n--- 🤖 CHATBOT BEHAVIOR (Session: {session_id}) 🤖 ---")
        print(f"💬 Query: {query}")
        print(f"🛠️  Tools Used: {[tc['tool'] for tc in tool_calls] if tool_calls else 'None'}")
        print(f"📊 Tokens: In={usage.request_tokens}, Out={usage.response_tokens}, Total={usage.total_tokens}")
        print(f"-------------------------------\n")
        
        return {
            "response": response_text,
            "tool_calls": tool_calls,
            "usage": usage,
            "session_id": session_id
        }
    except Exception as e:
        print(f"Error after retries in chat_with_pilot: {e}")
        raise HTTPException(status_code=500, detail=str(e))