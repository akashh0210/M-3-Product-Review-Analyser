#!/bin/bash

# Start FastAPI server on a background port
echo "🚀 Starting FastAPI Backend on port 8000..."
uvicorn server:app --host 0.0.0.0 --port 8000 &

# Wait for backend to initialize
sleep 5

# Start Streamlit dashboard on the primary Hugging Face port
echo "📊 Starting Streamlit Dashboard on port 7860..."
streamlit run dashboard.py --server.port 7860 --server.address 0.0.0.0 --server.headless true
