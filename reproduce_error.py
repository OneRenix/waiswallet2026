import requests
import json

BASE_URL = "http://localhost:8000/api"

def simulate_error():
    print("--- Simulating Frontend Error (Missing Balance) ---")
    
    # 1. Fetch a wallet ID
    try:
        r = requests.get(f"{BASE_URL}/state")
        data = r.json()
        if not data.get("wallets"):
            print("No wallets found.")
            return
        
        target_wallet = data["wallets"][0]
        wallet_id = target_wallet["id"]
        print(f"Target Wallet ID: {wallet_id}")

        # 2. Construct Payload WITHOUT balance (simulating the bug)
        payload = {
            "name": "EastWest Visa",
            "provider_id": 3,
            "color": "#f43f5e",
            "type": "credit",
            "credit_limit": 100000,
            "due_day": 25,
            "cycle_day": 5,
            "monthly_cashback_limit": 1500,
            "benefits": {}
        }
        # Note: "balance" is intentionally MISSING

        print("\nSending Invalid Payload (No Balance):")
        print(json.dumps(payload, indent=2))

        # 3. Send Request
        r = requests.put(f"{BASE_URL}/wallets/{wallet_id}", json=payload)
        
        print(f"\nResponse Code: {r.status_code}")
        print(f"Response Body: {r.text}")
        
        if r.status_code == 422:
            print("\n✅ SUCCESS: Reproduced the 422 Error as expected.")
        else:
            print(f"\n❌ UNEXPECTED: Got status {r.status_code} instead of 422.")
            
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    simulate_error()
