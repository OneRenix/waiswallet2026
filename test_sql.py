import asyncio
import os
from app.db.connection import get_db_connection
from app.routers.chat import chat_with_pilot, ChatRequest
from dotenv import load_dotenv

# Load environment variables (API Key)
load_dotenv()

async def test_sql_generation():
    print("🚀 STARTING SQL GENERATION TEST\n")
    
    # Setup DB using context manager
    with get_db_connection() as db:
        # Generate random session ID
        import uuid
        session_id = f"test_sql_{str(uuid.uuid4())[:8]}"
        
        # Query designed to trigger schema hallucination if not fixed
        # "wallet name" often hallucinates to "wallet_name" instead of "name"
        query = "What is the balance of my wallet named 'Main Wallet'?"
        
        req = ChatRequest(query=query, session_id=session_id)
        
        try:
            print(f"Turn 1 (Session: {session_id})")
            print(f"User: {query}")
            
            # This calls the full chain: Chat -> Strategic Pilot -> SQL Agent -> DB
            result = await chat_with_pilot(req, db)
            
            print("\n--- RESPONSE ---")
            print(f"Agent: {result['response']}")
            print(f"Tools Used: {[tc['tool'] for tc in result['tool_calls']]}")
            
            # Validation
            tool_calls = result['tool_calls']
            has_ask_db = any(tc['tool'] == 'ask_database' for tc in tool_calls)
            
            if has_ask_db:
                print("\n✅ PASS: Main Agent delegated to SQL Agent.")
            else:
                print("\n❌ FAIL: Main Agent did not use 'ask_database'.")
                
            # Check logs for "no such column" errors if possible, or infer from response.
            # Ideally we'd capture logs, but visual inspection of the response is good enough for this verification.
            if "error" in result['response'].lower() or "i couldn't find" in result['response'].lower():
                print("⚠️ WARNING: Agent reported an error. Check if it was a schema issue.")
            else:
                print("✅ PASS: Agent appeared to answer successfully.")

        except Exception as e:
            print(f"\n❌ CRASHED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_sql_generation())
