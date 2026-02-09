import asyncio
import uuid
import re
from app.db.connection import get_db_connection
from app.routers.chat import chat_with_pilot, ChatRequest

async def test_greeting():
    print("🚀 STARTING GREETING TEST")
    session_id = f"test_greet_{uuid.uuid4().hex[:8]}"
    
    with get_db_connection() as db:
        print(f"\nTurn 1 (New Session: {session_id})")
        req1 = ChatRequest(query="I want to buy a car for ₱180,000.", session_id=session_id)
        res1 = await chat_with_pilot(req1, db)
        response = res1['response']
        print(f"🤖 AI: {response}")
        
        # Check for common greeting keywords
        greeting_keywords = ["welcome", "hello", "hi", "greetings", "good to see you", "back"]
        has_greeting = any(kw in response.lower() for kw in greeting_keywords)
        
        if has_greeting:
            print("\n✅ PASS: Greeting detected.")
        else:
            print(f"\n⚠️ WARNING: No obvious greeting detected. Check tone manually.")

if __name__ == "__main__":
    asyncio.run(test_greeting())
