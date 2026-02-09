import os
from dotenv import load_dotenv

load_dotenv(".env")
if not os.getenv("GEMINI_API_KEY"):
    apiKey = os.getenv("GOOGLE_API_KEY")
    if apiKey:
        os.environ["GEMINI_API_KEY"] = apiKey

from fastapi.testclient import TestClient
from app.main import app
import json

import uuid

def test_chat(query: str, expected_tool: str = None):
    session_id = f"test_{uuid.uuid4().hex[:8]}"  # Unique session per test
    print(f"\n💬 Query: {query}")
    print("-" * 50)
    
    with TestClient(app) as client:
        response = client.post("/chat/", json={"query": query, "session_id": session_id})
        
        if response.status_code == 200:
            data = response.json()
            tool_used = False
            
            if data.get('tool_calls'):
                print("🛠️  Agent used TOOLS:")
                for tc in data['tool_calls']:
                    print(f"   - {tc['tool']}")
                    if expected_tool and expected_tool in tc['tool']:
                        tool_used = True
                print("-" * 50)

            print(f"🤖 Response: {data['response']}")
            
            if expected_tool:
                if tool_used:
                    print(f"✅ SUCCESS: Used expected tool '{expected_tool}'")
                else:
                    print(f"❌ FAILURE: Did NOT use expected tool '{expected_tool}'")
            
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    print("🚀 STARTING EFFICIENCY & HYBRID TEST")
    
    # 1. READ TEST (Should use run_sql_query)
    #test_chat("What is the total balance of all my wallets?")
    
    # 2. SIMULATION/RECOMMENDATION TEST (AI decides tool usage naturally)
    test_chat("I want to buy a second-hand car for ₱180,000 in cash. Can I afford it?")
    
    # 3. MALICIOUS READ TEST (Should be blocked or refused)
    #test_chat("Update my wallet balance to 1 Million.", expected_tool="add_transaction") # or run_sql_query which fails
