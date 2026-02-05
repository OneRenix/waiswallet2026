import os
import sqlite3
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from app.main import app
import json

# Load environment variables
load_dotenv(".env")

# Verify API key is loaded
if not os.getenv("GEMINI_API_KEY"):
    apiKey = os.getenv("GOOGLE_API_KEY")
    if apiKey:
        os.environ["GEMINI_API_KEY"] = apiKey
    else:
        print("⚠️ Warning: Neither GEMINI_API_KEY nor GOOGLE_API_KEY found in environment.")

# Database Configuration
DB_PATH = "app/data/waiswallet.db"

def save_recommendation(title, message, urgency_level="medium", reminder_frequency="weekly", reminder_at=None):
    """Saves a recommendation to the strategic_recommendations table."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        query = """
            INSERT INTO strategic_recommendations (title, message, urgency_level, status, reminder_frequency, remind_at)
            VALUES (?, ?, ?, 'pending', ?, ?)
        """
        cursor.execute(query, (title.strip(), message.strip(), urgency_level, reminder_frequency, reminder_at))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return False

def parse_and_save_recommendations(text):
    """
    Parses the AI's markdown/numbered list response and saves to DB.
    Iterates through lines to be more resilient than a single broad regex.
    """
    lines = text.split('\n')
    saved_count = 0
    
    for line in lines:
        # Look for lines starting with #. or * and containing Context and Frequency
        # Format: 1. **Title**. Context: message. [Frequency: weekly, RemindAt: ISO]
        match = re.search(r'(?:\d+\.|\*)\s*(?:\*\*)?([^\*\.\n]+)(?:\*\*)?[:\.]?\s*(?:Context:)?\s*([^\[\n]+)(?:\[Frequency:\s*([^,\]]+),\s*RemindAt:\s*([^\]]+)\])?', line, re.IGNORECASE)
        
        if match:
            group1, group2, group3, group4 = match.groups()
            title = group1 if group1 else ""
            message = group2 if group2 else ""
            freq = group3 if group3 else "weekly"
            remind_at = group4 if group4 else (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")

            if not title or not message:
                continue

            # Determine urgency based on keywords
            urgency = "medium"
            lower_msg = (title + " " + message).lower()
            if any(kw in lower_msg for kw in ["alert", "emergency", "urgent", "critical", "high"]):
                urgency = "high"
            elif any(kw in lower_msg for kw in ["suggestion", "maybe", "low", "optional"]):
                urgency = "low"
            
            # Map frequency to allowed DB values: ('daily', 'weekly', 'bi-weekly')
            freq = freq.strip().lower() if freq else "weekly"
            if freq not in ['daily', 'weekly', 'bi-weekly']:
                if 'month' in freq:
                    freq = 'bi-weekly'
                else:
                    freq = 'weekly'
            
            remind_at = group4.strip() if group4 else (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")

            if save_recommendation(title, message, urgency, freq, remind_at):
                saved_count += 1
                print(f"✅ Saved to DB: [{urgency.upper()}] {title.strip()} (Remind: {freq} at {remind_at})")
            
    return saved_count

def generate_recommendations():
    """
    Simulates a monthly standing check by asking the agent for proactive recommendations.
    """
    query = (
        "Based on my current financial standing (balances, cashback categories/history, goals, and recurring expenses), "
        "provide 3-5 proactive 'Wais' strategic recommendations for this month. "
        "Follow these rules:\n"
        "1. **Maximize Cashback**: Prioritize advice on which cards to use for upcoming expenses to hit rewards caps.\n"
        "2. **Respect History**: Do NOT repeat suggestions that are marked as 'dismissed', 'snoozed', or 'completed' in my history.\n"
        "3. **Non-Aggressive Tone**: Be helpful and budget-conscious, not demanding.\n"
        "4. **Reminders**: Suggest a 'Reminder Frequency' (STRICTLY ONE OF: daily, weekly, bi-weekly) and a 'Remind At' date (ISO format).\n"
        "\nFormat each recommendation strictly in one line like this:\n"
        "1. **Title**. Context: Detailed insight message. [Frequency: weekly, RemindAt: 2026-02-13 09:00:00]\n"
        "2. **Another Title**. Context: Another detailed insight message. [Frequency: bi-weekly, RemindAt: 2026-02-20 10:00:00]"
    )
    
    print(f"\n🚀 System: Generating Monthly Strategic Recommendations (Cashback & Lifecycle Focus)...")
    print("-" * 80)
    
    with TestClient(app) as client:
        response = client.post("/chat/", params={"query": query})
        
        if response.status_code == 200:
            data = response.json()
            
            # Display Tool Calls
            if data.get('tool_calls'):
                print("🛠️  Strategic Pilot analyzed the following data:")
                for tc in data['tool_calls']:
                    print(f"   - {tc['tool']}({tc['args']})")
                print("-" * 80)

            response_text = data['response']
            print(f"💡 STRATEGIC INSIGHTS:\n")
            print(response_text)
            print("-" * 80)
            
            # Save to Database
            print(f"💾 Persisting to Database...")
            count = parse_and_save_recommendations(response_text)
            print(f"✨ Successfully persisted {count} recommendations to 'strategic_recommendations' table.")
            print("-" * 80)
            
            print(f"📊 Usage: {json.dumps(data['usage'], indent=2)}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    generate_recommendations()
