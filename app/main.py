from fastapi import FastAPI
from .routers import chat

app = FastAPI(title="WaisWallet")

# Include the different AI modules
app.include_router(chat.router)

@app.get("/")
def health_check():
    return {"status": "Operational", "engine": "Gemini-2.5-Flash"}