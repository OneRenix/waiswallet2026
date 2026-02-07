#!/bin/bash

# Terminate background processes on exit
trap 'kill $(jobs -p)' EXIT

echo "🚀 Starting WaisWallet Development Servers..."

# Start Backend
echo "Backend: Starting FastAPI on http://localhost:8000"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# Start Frontend
echo "Frontend: Starting Vite on http://localhost:3000"
cd frontend && npm run dev -- --port 3000 --host 0.0.0.0

# Wait for all background processes
wait
