import asyncio
import uuid
from app.db.connection import get_db_connection
from app.routers.chat import chat_with_pilot, ChatRequest
from dotenv import load_dotenv

load_dotenv()

async def test_assumptions():
    print("🚀 STARTING ASSUMPTION TEST\n")
    
    session_id = f"test_assumption_{str(uuid.uuid4())[:8]}"
    
    query = "I want to purchase a new phone worth 30k, can I afford it?"
    
    print(f"💬 Query: {query}")
    req = ChatRequest(query=query, session_id=session_id)
    
    with get_db_connection() as db:
        try:
            result = await chat_with_pilot(req, db)
            print("\n--- 🤖 CHATBOT RESPONSE ---")
            print(result['response'])
            print("\n--------------------------")
            
            response_lower = result['response'].lower()
            unwanted_terms = ["buy now pay later", "bnpl", "installment", "using a promo"]
            
            found = [term for term in unwanted_terms if term in response_lower]
            if found:
                print(f"⚠️  Potential Assumption Found: {found}")
            else:
                print("✅ No automatic payment assumptions detected.")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_assumptions())
