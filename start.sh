#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================="
echo " Starting Phronesis (φρόνησις)"
echo " Question the decision. Examine the mind."
echo "=========================================="

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
npm run dev -- --host 0.0.0.0 --port 5180 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down Phronesis servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Phronesis is running!"
echo "👉 Frontend: http://localhost:5180"
echo "👉 Backend API: http://localhost:8010"
echo "👉 API Docs: http://localhost:8010/docs"
wait
