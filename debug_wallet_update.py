import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_update_wallet():
    # 1. Get existing wallet to find a valid ID
    print("Fetching wallets...")
    try:
        r = requests.get(f"{BASE_URL}/state")
        data = r.json()
        if not data.get("wallets"):
            print("No wallets found to test update.")
            return
        
        target_wallet = data["wallets"][0]
        wallet_id = target_wallet["id"]
        print(f"Targeting Wallet ID: {wallet_id} ({target_wallet['name']})")
        
        # 2. Construct Payload
        # Mimic what the frontend sends
        payload = {
            "name": target_wallet["name"] + " (Updated)",
            "provider_id": target_wallet.get("provider_id", 1), # Default to 1 if missing
            "type": target_wallet["type"],
            "balance": target_wallet["balance"],
            "credit_limit": target_wallet.get("credit_limit"),
            "cycle_day": target_wallet.get("cycle_day"),
            "due_day": target_wallet.get("due_day"),
            "monthly_cashback_limit": target_wallet.get("monthly_cashback_limit"),
            "color": target_wallet.get("color", "#3b82f6"),
            "benefits": {
                "1": 5.0, # Groceries
                "2": 2.0  # Dining
            }
        }
        
        print("\nSending PUT Request Payload:")
        print(json.dumps(payload, indent=2))
        
        # 3. Send Request
        r = requests.put(f"{BASE_URL}/wallets/{wallet_id}", json=payload)
        
        print(f"\nResponse Status Code: {r.status_code}")
        print(f"Response Body: {r.text}")
        
    except Exception as e:
        print(f"Test Failed Connection: {e}")

if __name__ == "__main__":
    test_update_wallet()
