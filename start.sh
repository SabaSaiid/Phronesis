#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================="
echo " Starting Phronesis (φρόνησις)"
echo " Question the decision. Examine the mind."
echo "=========================================="

# Pre-flight: Clean up any stale processes on ports 8010 and 5180
lsof -ti:8010 | xargs kill -9 2>/dev/null || true
lsof -ti:5180 | xargs kill -9 2>/dev/null || true

# Check and start backend on port 8010
cd "$DIR/backend"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

echo "🚀 Starting FastAPI Backend on http://localhost:8010 ..."
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload &
BACKEND_PID=$!

# Start frontend on port 5180
echo "🚀 Starting Vite Frontend on http://localhost:5180 ..."
cd "$DIR/frontend"
npx vite --host 0.0.0.0 --port 5180 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down Phronesis servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    # Kill any orphaned subprocesses on ports 8010 and 5180
    lsof -ti:8010 | xargs kill -9 2>/dev/null || true
    lsof -ti:5180 | xargs kill -9 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "Phronesis is running!"
echo "👉 Frontend: http://localhost:5180"
echo "👉 Backend API: http://localhost:8010"
echo "👉 API Docs: http://localhost:8010/docs"
wait

