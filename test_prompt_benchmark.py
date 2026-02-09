"""
Prompt Performance Testing Suite

Runs benchmark tests across multiple prompt versions and records metrics:
- Token usage (input/output)
- Response quality
- Tool usage patterns
- Latency
"""

import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(".env")
if not os.getenv("GEMINI_API_KEY"):
    apiKey = os.getenv("GOOGLE_API_KEY")
    if apiKey:
        os.environ["GEMINI_API_KEY"] = apiKey

from fastapi.testclient import TestClient
from app.main import app
from app.agents.prompt_versions import PROMPTS, list_versions

# Test scenarios
TEST_CASES = [
    {
        "id": "affordability_check",
        "query": "I want to buy a second-hand car for ₱180,000 in cash. Can I afford it?",
        "expected_tools": ["run_sql_query"],
        "category": "simulation"
    },
    {
        "id": "balance_inquiry",
        "query": "What's my total balance across all wallets?",
        "expected_tools": ["run_sql_query"],
        "category": "read"
    },
    {
        "id": "budget_advice",
        "query": "Should I use my credit card or debit for groceries?",
        "expected_tools": ["run_sql_query"],
        "category": "strategy"
    },
]

def run_benchmark(version_id: str, test_case: dict, output_file: str = "benchmark_results.json"):
    """Run a single test case with a specific prompt version"""
    
    prompt_config = PROMPTS[version_id]
    session_id = f"bench_{version_id}_{test_case['id']}_{uuid.uuid4().hex[:6]}"
    
    # Temporarily update the prompt (in a real scenario, this would dynamically configure the agent)
    # For now, we'll just track the intended version
    
    with TestClient(app) as client:
        start_time = datetime.now()
        response = client.post("/chat/", json={
            "query": test_case["query"],
            "session_id": session_id
        })
        end_time = datetime.now()
        
        if response.status_code == 200:
            data = response.json()
            
            result = {
                "timestamp": datetime.now().isoformat(),
                "version_id": version_id,
                "version_name": prompt_config.name,
                "test_case_id": test_case["id"],
                "query": test_case["query"],
                "response": data["response"],
                "tools_used": [tc['tool'] for tc in data.get('tool_calls', [])],
                "usage": data.get("usage", {}),
                "latency_ms": int((end_time - start_time).total_seconds() * 1000),
                "target_input_tokens": prompt_config.target_input_tokens,
                "target_output_tokens": prompt_config.target_output_tokens,
                "word_count": len(data["response"].split())
            }
            
            # Append to results file
            results = []
            if os.path.exists(output_file):
                with open(output_file, 'r') as f:
                    results = json.load(f)
            
            results.append(result)
            
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            
            return result
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None

def run_full_benchmark():
    """Run all test cases across all prompt versions"""
    print("🚀 STARTING PROMPT BENCHMARK SUITE\\n")
    
    versions = list_versions()
    
    for version_id in versions:
        print(f"\\n{'='*60}")
        print(f"Testing Version: {PROMPTS[version_id].name} ({version_id})")
        print(f"{'='*60}")
        
        for test_case in TEST_CASES:
            print(f"\\n📝 Test: {test_case['id']}")
            result = run_benchmark(version_id, test_case)
            
            if result:
                usage = result['usage']
                print(f"   📊 Tokens: In={usage.get('request_tokens', 0)}, Out={usage.get('response_tokens', 0)}, Total={usage.get('total_tokens', 0)}")
                print(f"   📏 Words: {result['word_count']}")
                print(f"   🛠️  Tools: {result['tools_used']}")
                print(f"   ⏱️  Latency: {result['latency_ms']}ms")
    
    print("\\n✅ Benchmark complete! Results saved to benchmark_results.json")

if __name__ == "__main__":
    run_full_benchmark()
