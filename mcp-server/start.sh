#!/bin/bash
set -e

echo "Starting Nginx Reverse Proxy..."
service nginx start


echo "Starting FastAPI Backend on port 8000..."
uvicorn server:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

sleep 3

if ! kill -0 $FASTAPI_PID 2>/dev/null; then
    echo "FastAPI failed to start!"
    exit 1
fi

echo "Starting Streamlit Dashboard on port 8501..."
streamlit run dashboard.py \
    --server.port 8501 \
    --server.address 0.0.0.0 \
    --server.headless true \
    --browser.gatherUsageStats false
