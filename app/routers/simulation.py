from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlite3 import Connection
from ..db.connection import get_db_session
from ..agents.simulation import simulation_agent
from ..agents.pilot import PilotDeps
import json

router = APIRouter(prefix="/api/simulate", tags=["Simulation"])

class SimulationRequest(BaseModel):
    amount: float
    category: str
    card_id: int
    payment_type: str
    term: int
    description: Optional[str] = ""

@router.post("/")
async def run_simulation(request: SimulationRequest, db: Connection = Depends(get_db_session)):
    try:
        # 1. Package Context
        with open("app/data/database_compact.md", "r") as f:
            rules = f.read()
        
        deps = PilotDeps(db=db, system_rules=rules, is_new_session=False)
        
        # 2. Build Query for Agent
        query = (
            f"Please analyze this simulation: \n"
            f"- Description: {request.description}\n"
            f"- Amount: {request.amount}\n"
            f"- Category: {request.category}\n"
            f"- Card ID: {request.card_id}\n"
            f"- Payment Type: {request.payment_type}\n"
            f"- Term: {request.term} months\n"
        )
        
        # 3. Run Agent
        result = await simulation_agent.run(query, deps=deps)
        
        # 4. Return Structured Data
        return result.output

    except Exception as e:
        print(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
