import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing app code
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(env_path)

# Verify API key is loaded
if not os.getenv("GEMINI_API_KEY"):
    # Try common alternatives or check if it's named differently
    apiKey = os.getenv("GOOGLE_API_KEY")
    if apiKey:
        os.environ["GEMINI_API_KEY"] = apiKey
    else:
        print(f"⚠️ Warning: GEMINI_API_KEY not found in {env_path}")

import asyncio
from fastapi.testclient import TestClient
from app.main import app
import json

# Initialize the TestClient with the FastAPI app
client = TestClient(app)

def test_chat(query: str):
    print(f"\n💬 Query: {query}")
    print("-" * 50)
    
    # Send a POST request to the chat endpoint
    # Note: query is a query parameter in the current chat.py implementation
    response = client.post(f"/chat/?query={query}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Display Tool Calls if any
        if data.get('tool_calls'):
            print("🛠️  Agent used the following tools:")
            for tc in data['tool_calls']:
                print(f"   - {tc['tool']}({tc['args']})")
            print("-" * 50)

        print(f"🤖 Response: {data['response']}")
        print("-" * 50)
        print(f"📊 Usage: {json.dumps(data['usage'], indent=2)}")
    else:
        print(f"❌ Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    # Sample test queries
    #test_chat("how much is my balance in my EastWest Visa wallet?")
    #test_chat("How much is my credit in my Amore wallet?")
    test_chat("What are my current recurring expenses?")
    #test_chat("Check my goal progress for the Emergency Fund.")
    #test_chat("How much do I have in savings?")
    #test_chat("What is my current balance across all wallets?")
    #test_chat("What are my top 3 spending categories for this month")
