from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import api, chat, simulation

app = FastAPI(title="WaisWallet API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)
app.include_router(chat.router)
app.include_router(simulation.router)

@app.get("/")
def health_check():
    return {"status": "Operational", "engine": "Gemini-2.0-Flash"}