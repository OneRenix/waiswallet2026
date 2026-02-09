import asyncio
import time
import uuid
from app.db.connection import get_db_connection
from app.routers.chat import chat_with_pilot, ChatRequest
from dotenv import load_dotenv

load_dotenv()

async def test_performance():
    print("🚀 STARTING LATENCY TEST\n")
    
    session_id = f"test_perf_{str(uuid.uuid4())[:8]}"
    
    questions = [
        "I want to purchase a new phone worth 30k, can I afford it?",
        "What would be the best credit card to use?"
    ]
    
    with get_db_connection() as db:
        for i, q in enumerate(questions):
            print(f"\n--- Turn {i+1}: {q} ---")
            req = ChatRequest(query=q, session_id=session_id)
            
            start_time = time.time()
            try:
                result = await chat_with_pilot(req, db)
                duration = time.time() - start_time
                
                print(f"⏱️ Duration: {duration:.2f}s")
                print(f"🛠️ Tools: {[tc['tool'] for tc in result['tool_calls']]}")
                # print(f"Response: {result['response'][:100]}...")
            except Exception as e:
                print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_performance())
