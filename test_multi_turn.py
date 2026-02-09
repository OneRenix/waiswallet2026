
import asyncio
import os
import uuid
from app.db.connection import get_db_connection
from app.routers.chat import chat_with_pilot, ChatRequest

async def test_multi_turn():
    print("🚀 STARTING MULTI-TURN MEMORY TEST")
    session_id = f"test_{uuid.uuid4().hex[:8]}"
    
    with get_db_connection() as db:
        # Step 1: Initial Question
        print(f"\nTurn 1 (Session: {session_id})")
        req1 = ChatRequest(query="I want to buy a car for ₱180,000 in cash. Can I afford it?", session_id=session_id)
        res1 = await chat_with_pilot(req1, db)
        print(f"🤖 AI: {res1['response']}")
        
        # Step 2: Follow-up
        print(f"\nTurn 2 (Session: {session_id})")
        req2 = ChatRequest(query="Actually, I'll use my Debit wallet. Check my BPI Debit.", session_id=session_id)
        res2 = await chat_with_pilot(req2, db)
        print(f"🤖 AI: {res2['response']}")
        
        # Step 3: Verify Tools
        tools_used = res2.get('tool_calls', [])
        print(f"🛠️  Tools Used in Turn 2: {[t['tool'] for t in tools_used]}")
        
    print("\n✅ MULTI-TURN TEST COMPLETE")

if __name__ == "__main__":
    asyncio.run(test_multi_turn())
